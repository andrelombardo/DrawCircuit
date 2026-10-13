#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod workspace;

use std::sync::atomic::{AtomicBool, Ordering};
use tauri::menu::{Menu, MenuItem, PredefinedMenuItem, Submenu};
use tauri::{Emitter, Manager};

struct ExitAllowed(AtomicBool);

#[tauri::command]
fn frontend_ready(allowed: tauri::State<ExitAllowed>) {
    allowed.0.store(false, Ordering::SeqCst);
}

#[tauri::command]
fn finish_exit(app: tauri::AppHandle, allowed: tauri::State<ExitAllowed>) {
    allowed.0.store(true, Ordering::SeqCst);
    app.exit(0);
}

fn edit_menu(handle: &tauri::AppHandle, native: bool) -> tauri::Result<Submenu<tauri::Wry>> {
    if native {
        return Submenu::with_id_and_items(
            handle,
            "edit",
            "Modifica",
            true,
            &[
                &PredefinedMenuItem::undo(handle, Some("Annulla"))?,
                &PredefinedMenuItem::redo(handle, Some("Ripeti"))?,
                &PredefinedMenuItem::separator(handle)?,
                &PredefinedMenuItem::cut(handle, Some("Taglia"))?,
                &PredefinedMenuItem::copy(handle, Some("Copia"))?,
                &PredefinedMenuItem::paste(handle, Some("Incolla"))?,
                &PredefinedMenuItem::select_all(handle, Some("Seleziona tutto"))?,
            ],
        );
    }
    let item = |id, text, shortcut| MenuItem::with_id(handle, id, text, true, shortcut);
    Submenu::with_id_and_items(
        handle,
        "edit",
        "Modifica",
        true,
        &[
            &item("undo", "Annulla", Some("CmdOrCtrl+Z"))?,
            &item("redo", "Ripeti", Some("CmdOrCtrl+Shift+Z"))?,
            &PredefinedMenuItem::separator(handle)?,
            &item("cut", "Taglia", Some("CmdOrCtrl+X"))?,
            &item("copy", "Copia", Some("CmdOrCtrl+C"))?,
            &item("paste", "Incolla", Some("CmdOrCtrl+V"))?,
            &item("select_all", "Seleziona tutto", Some("CmdOrCtrl+A"))?,
        ],
    )
}

// Native file panels need the Cocoa responder-chain Edit commands rather than
// editor commands. Restore the circuit menu when the panel closes.
#[tauri::command]
fn native_file_dialog(app: tauri::AppHandle, active: bool) -> Result<(), String> {
    let replacement = edit_menu(&app, active).map_err(|e| e.to_string())?;
    let menu = app.menu().ok_or("Menu non disponibile")?;
    menu.remove_at(2).map_err(|e| e.to_string())?;
    menu.insert(&replacement, 2).map_err(|e| e.to_string())?;
    Ok(())
}

fn main() {
    let app = tauri::Builder::default()
        .manage(ExitAllowed(AtomicBool::new(true)))
        .manage(workspace::DiskLock::default())
        .plugin(tauri_plugin_single_instance::init(|app, _, _| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }))
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .invoke_handler(tauri::generate_handler![
            workspace::load_workspace,
            workspace::save_workspace,
            finish_exit,
            frontend_ready,
            native_file_dialog
        ])
        .setup(|app| {
            let handle = app.handle();
            let item = |id, text, shortcut| MenuItem::with_id(handle, id, text, true, shortcut);
            let app_menu = Submenu::with_items(
                handle,
                "DrawCircuit",
                true,
                &[
                    &PredefinedMenuItem::about(handle, Some("Informazioni su DrawCircuit"), None)?,
                    &PredefinedMenuItem::separator(handle)?,
                    &PredefinedMenuItem::hide(handle, Some("Nascondi DrawCircuit"))?,
                    &PredefinedMenuItem::hide_others(handle, Some("Nascondi altre"))?,
                    &PredefinedMenuItem::show_all(handle, Some("Mostra tutte"))?,
                    &PredefinedMenuItem::separator(handle)?,
                    &item("quit", "Esci da DrawCircuit", Some("CmdOrCtrl+Q"))?,
                ],
            )?;
            let file_menu = Submenu::with_items(
                handle,
                "File",
                true,
                &[
                    &item("open", "Apri archivio…", Some("CmdOrCtrl+O"))?,
                    &item("save", "Salva archivio…", Some("CmdOrCtrl+S"))?,
                    &PredefinedMenuItem::separator(handle)?,
                    &item("export", "Esporta circuito…", Some("CmdOrCtrl+E"))?,
                ],
            )?;
            let edit_menu = edit_menu(handle, false)?;
            let window_menu = Submenu::with_items(
                handle,
                "Finestra",
                true,
                &[
                    &PredefinedMenuItem::minimize(handle, Some("Riduci a icona"))?,
                    &PredefinedMenuItem::maximize(handle, Some("Ingrandisci"))?,
                    &PredefinedMenuItem::fullscreen(handle, Some("Schermo intero"))?,
                ],
            )?;
            app.set_menu(Menu::with_items(
                handle,
                &[&app_menu, &file_menu, &edit_menu, &window_menu],
            )?)?;
            app.on_menu_event(|app, event| {
                let _ = app.emit("desktop-menu", event.id().as_ref());
            });
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("Impossibile avviare DrawCircuit");
    app.run(|app, event| {
        if let tauri::RunEvent::ExitRequested { api, .. } = event {
            if !app.state::<ExitAllowed>().0.load(Ordering::SeqCst) {
                api.prevent_exit();
                let _ = app.emit("desktop-close", ());
            }
        }
    });
}
