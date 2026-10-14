#[cfg(target_os = "macos")]
pub fn configure(window: &tauri::WebviewWindow) -> tauri::Result<()> {
    window.with_webview(|webview| {
        use objc2::{MainThreadMarker, MainThreadOnly};
        use objc2_app_kit::{
            NSTitlebarSeparatorStyle, NSToolbar, NSToolbarDisplayMode, NSWindow,
            NSWindowToolbarStyle,
        };
        use objc2_foundation::ns_string;

        // Tauri dispatches this closure on the AppKit main thread. NSWindow
        // retains the toolbar and owns the controls' layout across transitions.
        let mtm = MainThreadMarker::new().expect("AppKit main thread");
        let native: &NSWindow = unsafe { &*webview.ns_window().cast() };
        let toolbar = NSToolbar::initWithIdentifier(
            NSToolbar::alloc(mtm),
            ns_string!("it.drawcircuit.window-toolbar"),
        );
        toolbar.setDisplayMode(NSToolbarDisplayMode::IconOnly);
        toolbar.setAllowsUserCustomization(false);
        toolbar.setAllowsDisplayModeCustomization(false);
        native.setToolbarStyle(NSWindowToolbarStyle::Unified);
        native.setToolbar(Some(&toolbar));
        native.setTitlebarAppearsTransparent(true);
        native.setTitlebarSeparatorStyle(NSTitlebarSeparatorStyle::None);
    })
}

#[tauri::command]
pub async fn window_header_height(window: tauri::WebviewWindow) -> Result<f64, String> {
    #[cfg(target_os = "macos")]
    {
        let (sender, mut receiver) = tauri::async_runtime::channel(1);
        window
            .with_webview(move |webview| {
                use objc2_app_kit::{NSWindow, NSWindowButton};
                let native: &NSWindow = unsafe { &*webview.ns_window().cast() };
                let height = native
                    .standardWindowButton(NSWindowButton::CloseButton)
                    .map(|button| {
                        let rect = button.convertRect_toView(button.bounds(), None);
                        2.0 * (native.frame().size.height - rect.origin.y - rect.size.height / 2.0)
                    })
                    .unwrap_or(52.0);
                let _ = sender.try_send(height);
            })
            .map_err(|e| e.to_string())?;
        receiver
            .recv()
            .await
            .ok_or_else(|| "Geometria della finestra non disponibile".into())
    }
    #[cfg(not(target_os = "macos"))]
    {
        let _ = window;
        Ok(60.0)
    }
}
