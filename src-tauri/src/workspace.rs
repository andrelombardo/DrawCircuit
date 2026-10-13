use serde::{Deserialize, Serialize};
use std::{
    collections::BTreeMap,
    fs,
    io::Write,
    path::Path,
    sync::{Arc, Mutex},
    time::{SystemTime, UNIX_EPOCH},
};
use tauri::Manager;

const MAX_BYTES: usize = 64 * 1024 * 1024;
#[derive(Default)]
pub struct DiskLock(Arc<Mutex<()>>);

#[derive(Serialize, Deserialize)]
struct Workspace {
    version: u8,
    entries: BTreeMap<String, String>,
}
#[derive(Serialize)]
pub struct LoadedWorkspace {
    entries: BTreeMap<String, String>,
    recovered: bool,
}
fn validate(entries: &BTreeMap<String, String>) -> Result<(), String> {
    if entries.len() > 1000 || entries.keys().any(|key| !key.starts_with("drawcircuit.")) {
        return Err("Archivio locale non valido.".into());
    }
    Ok(())
}
fn read(path: &Path) -> Result<Workspace, String> {
    let size = fs::metadata(path).map_err(|e| e.to_string())?.len();
    if size > MAX_BYTES as u64 {
        return Err("Archivio locale troppo grande.".into());
    }
    let data = fs::read(path).map_err(|e| e.to_string())?;
    let workspace: Workspace = serde_json::from_slice(&data).map_err(|e| e.to_string())?;
    if workspace.version != 1 {
        return Err("Versione archivio non supportata.".into());
    }
    validate(&workspace.entries)?;
    Ok(workspace)
}
fn load(path: &Path) -> Result<LoadedWorkspace, String> {
    if !path.exists() && !path.with_extension("backup.json").exists() {
        return Ok(LoadedWorkspace {
            entries: BTreeMap::new(),
            recovered: false,
        });
    }
    match read(path) {
        Ok(workspace) => Ok(LoadedWorkspace {
            entries: workspace.entries,
            recovered: false,
        }),
        Err(_) => {
            let backup = path.with_extension("backup.json");
            let workspace = read(&backup).map_err(|_| "Il salvataggio locale e la copia di sicurezza non sono leggibili. I file originali sono stati conservati.".to_string())?;
            Ok(LoadedWorkspace {
                entries: workspace.entries,
                recovered: true,
            })
        }
    }
}
fn atomic_write(path: &Path, bytes: &[u8]) -> Result<(), String> {
    let next = path.with_extension("next.json");
    let mut file = fs::File::create(&next).map_err(|e| e.to_string())?;
    file.write_all(bytes)
        .and_then(|_| file.sync_all())
        .map_err(|e| e.to_string())?;
    fs::rename(&next, path).map_err(|e| e.to_string())?;
    if let Some(parent) = path.parent() {
        if let Ok(directory) = fs::File::open(parent) {
            let _ = directory.sync_all();
        }
    }
    Ok(())
}
fn save(path: &Path, entries: BTreeMap<String, String>) -> Result<(), String> {
    validate(&entries)?;
    let bytes = serde_json::to_vec(&Workspace {
        version: 1,
        entries,
    })
    .map_err(|e| e.to_string())?;
    if bytes.len() > MAX_BYTES {
        return Err("Archivio locale troppo grande.".into());
    }
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    if path.exists() {
        if read(path).is_ok() {
            let previous = fs::read(path).map_err(|e| e.to_string())?;
            atomic_write(&path.with_extension("backup.json"), &previous)?;
        } else {
            let timestamp = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .map_err(|e| e.to_string())?
                .as_nanos();
            fs::copy(
                path,
                path.with_extension(format!("recovery.{timestamp}.json")),
            )
            .map_err(|e| e.to_string())?;
        }
    }
    atomic_write(path, &bytes)
}
#[tauri::command]
pub async fn load_workspace(
    app: tauri::AppHandle,
    lock: tauri::State<'_, DiskLock>,
) -> Result<LoadedWorkspace, String> {
    let lock = lock.0.clone();
    let path = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("workspace.json");
    tauri::async_runtime::spawn_blocking(move || {
        let _guard = lock.lock().map_err(|e| e.to_string())?;
        load(&path)
    })
    .await
    .map_err(|e| e.to_string())?
}
#[tauri::command]
pub async fn save_workspace(
    app: tauri::AppHandle,
    lock: tauri::State<'_, DiskLock>,
    entries: BTreeMap<String, String>,
) -> Result<(), String> {
    let lock = lock.0.clone();
    let path = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("workspace.json");
    tauri::async_runtime::spawn_blocking(move || {
        let _guard = lock.lock().map_err(|e| e.to_string())?;
        save(&path, entries)
    })
    .await
    .map_err(|e| e.to_string())?
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::atomic::{AtomicU64, Ordering};
    static FIXTURE_ID: AtomicU64 = AtomicU64::new(0);
    fn fixture() -> std::path::PathBuf {
        let id = FIXTURE_ID.fetch_add(1, Ordering::Relaxed);
        std::env::temp_dir()
            .join(format!("drawcircuit-storage-{}-{id}", std::process::id()))
            .join("workspace.json")
    }
    fn entries(value: &str) -> BTreeMap<String, String> {
        BTreeMap::from([("drawcircuit.document.v1".into(), value.into())])
    }
    #[test]
    fn atomically_saves_and_keeps_the_previous_committed_copy() {
        let path = fixture();
        save(&path, entries("first")).unwrap();
        save(&path, entries("second")).unwrap();
        assert_eq!(load(&path).unwrap().entries, entries("second"));
        assert_eq!(
            read(&path.with_extension("backup.json")).unwrap().entries,
            entries("first")
        );
        fs::remove_dir_all(path.parent().unwrap()).unwrap();
    }
    #[test]
    fn recovers_without_destroying_an_unreadable_original() {
        let path = fixture();
        save(&path, entries("first")).unwrap();
        save(&path, entries("second")).unwrap();
        fs::write(&path, "unreadable").unwrap();
        let recovered = load(&path).unwrap();
        assert!(recovered.recovered);
        assert_eq!(recovered.entries, entries("first"));
        save(&path, recovered.entries).unwrap();
        assert!(fs::read_dir(path.parent().unwrap()).unwrap().any(|f| f
            .unwrap()
            .file_name()
            .to_string_lossy()
            .contains("recovery")));
        fs::remove_dir_all(path.parent().unwrap()).unwrap();
    }
    #[test]
    fn rejects_foreign_keys_before_touching_the_current_file() {
        let path = fixture();
        save(&path, entries("original")).unwrap();
        assert!(save(
            &path,
            BTreeMap::from([("unrelated".into(), "secret".into())])
        )
        .is_err());
        assert_eq!(load(&path).unwrap().entries, entries("original"));
        fs::remove_dir_all(path.parent().unwrap()).unwrap();
    }
    #[test]
    fn restores_backup_when_the_primary_file_is_missing() {
        let path = fixture();
        save(&path, entries("first")).unwrap();
        save(&path, entries("second")).unwrap();
        fs::remove_file(&path).unwrap();
        let recovered = load(&path).unwrap();
        assert!(recovered.recovered);
        assert_eq!(recovered.entries, entries("first"));
        fs::remove_dir_all(path.parent().unwrap()).unwrap();
    }
}
