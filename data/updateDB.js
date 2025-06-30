const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'update.json');

function getCommitHash() {
    if (!fs.existsSync(dbPath)) return null;
    const data = fs.readFileSync(dbPath, 'utf-8');
    try {
        return JSON.parse(data).commit;
    } catch (e) {
        return null;
    }
}

function setCommitHash(hash) {
    const data = { commit: hash };
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

module.exports = { getCommitHash, setCommitHash };
