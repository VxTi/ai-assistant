import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron'
import { join }                                       from 'path'
import { electronApp, is, optimizer }                 from '@electron-toolkit/utils'
import icon                                           from '../../resources/icon.png?asset'
import dotenv                                         from 'dotenv';
import * as fs                                        from "node:fs";

dotenv.config({ path: join(__dirname, '../../.env') });

function createWindow(): void {
    // Create the browser window.
    const mainWindow = new BrowserWindow(
        {
            width: 900,
            height: 670,
            show: false,
            autoHideMenuBar: true,
            ...(process.platform === 'linux' ? { icon } : {}),
            webPreferences: {
                preload: join(__dirname, '../preload/index.js'),
                sandbox: false
            }
        });

    mainWindow.on('ready-to-show', () => {
        mainWindow.show()
    });

    mainWindow.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url)
        return { action: 'deny' }
    })

    // HMR for renderer base on electron-vite cli.
    // Load the remote URL for development or the local html file for production.
    if ( is.dev && process.env[ 'ELECTRON_RENDERER_URL' ] ) {
        mainWindow.loadURL(process.env[ 'ELECTRON_RENDERER_URL' ])
    }
    else {
        mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
    }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
    // Set app user model id for windows
    electronApp.setAppUserModelId('com.electron')

    // Default open or close DevTools by F12 in development
    // and ignore CommandOrControl + R in production.
    // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
    app.on('browser-window-created', (_, window) => {
        optimizer.watchWindowShortcuts(window)
    })

    createWindow()

    app.on('activate', function () {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if ( BrowserWindow.getAllWindows().length === 0 ) createWindow()
    })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if ( process.platform !== 'darwin' ) {
        app.quit()
    }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.

ipcMain.handle('open-file', async (_) => {
    return await dialog.showOpenDialog(
                           {
                               title: 'Select file to upload',
                               properties: [ 'openFile', 'multiSelections' ],
                               buttonLabel: 'Select',
                               message: 'Select a file to upload',
                               defaultPath: app.getPath('home')
                           })
                       .then(result =>
                                 !result.canceled ? result.filePaths : [])
                       .catch(() => [])
});

ipcMain.handle('open-directory', async (_) => {
    return await dialog.showOpenDialog(
                           {
                               title: 'Select directory to upload',
                               properties: [ 'openDirectory' ],
                               buttonLabel: 'Select',
                               message: 'Select a directory to upload',
                               defaultPath: app.getPath('home')
                           })
                       .then(result => {
                           if ( !result.canceled ) {
                               return result.filePaths[ 0 ];
                           }
                           return null;
                       })
                       .catch(() => null)
});

function ensureTopicHistoryFileExists() {
    const filePath = join(app.getPath('userData'), 'topic-history.json');
    if ( !fs.existsSync(filePath) ) {
        fs.writeFileSync(filePath, '[]');
    }
}

ipcMain.handle('save-topic-history', async (_, topics: any[]) => {
    ensureTopicHistoryFileExists();
    await fs.promises.writeFile(join(app.getPath('userData'), 'topic-history.json'), JSON.stringify(topics));
});

ipcMain.handle('get-topic-history', async (_) => {
    const filePath = join(app.getPath('userData'), 'topic-history.json');
    if ( !fs.existsSync(filePath) ) {
        console.log("Writing topic history file to: " + filePath);
        fs.writeFileSync(filePath, '[]');
        return [];
    }
    return JSON.parse(await fs.promises.readFile(filePath, 'utf-8'));
})