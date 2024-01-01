import * as child_process from 'child_process';

function isMakeAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
        child_process.exec('which make', (err) => {
            if (err) {
                resolve(false);
            } else {
                resolve(true);
            }
        });
    });
}

export { isMakeAvailable };