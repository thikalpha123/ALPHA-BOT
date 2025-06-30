const { cmd } = require('../command');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const { getCommitHash, setCommitHash } = require('../data/updateDB');

cmd({
    pattern: 'update',
    alias: ['upgrade', 'sync'],
    react: '🧩',
    desc: 'Update only the plugins folder of DANUWA-MD.',
    category: 'owner',
    filename: __filename
}, async (conn, mek, m, { reply, isOwner }) => {
    if (!isOwner) return reply('❌ Only the bot owner can perform updates.');

    try {
        await reply('🔍 Checking for plugin updates...');

        const REPO = 'DANUWA-MD/DANUWA-BOT';
        const BRANCH = 'main';

        // Fetch latest commit hash for plugins/
        const { data: commits } = await axios.get(`https://api.github.com/repos/${REPO}/commits?path=plugins`);
        const latestCommit = commits[0]?.sha;
        const currentCommit = await getCommitHash();

        if (latestCommit === currentCommit) {
            return reply('✅ Your plugins folder is already up-to-date!');
        }

        await reply('📥 Downloading latest plugins folder...');
        const zipUrl = `https://github.com/${REPO}/archive/${BRANCH}.zip`;
        const zipPath = path.join(__dirname, 'plugins_update.zip');
        const extractPath = path.join(__dirname, 'plugins_update');

        const { data: zipData } = await axios.get(zipUrl, { responseType: 'arraybuffer' });
        fs.writeFileSync(zipPath, zipData);

        await reply('📦 Extracting update...');
        const zip = new AdmZip(zipPath);
        zip.extractAllTo(extractPath, true);

        const extractedRepoName = `${REPO.split('/')[1]}-${BRANCH}`;
        const newPluginsPath = path.join(extractPath, extractedRepoName, 'plugins');
        const localPluginsPath = path.join(__dirname, '..', 'plugins');

        await reply('🔄 Replacing plugins folder...');
        copyFolderSync(newPluginsPath, localPluginsPath);

        // Save the latest commit hash
        await setCommitHash(latestCommit);

        // Cleanup
        fs.unlinkSync(zipPath);
        fs.rmSync(extractPath, { recursive: true, force: true });

        await reply('✅ Plugins updated successfully! Restarting bot...');
        process.exit(0);

    } catch (err) {
        console.error('Plugin update error:', err);
        return reply('❌ Plugin update failed: ' + err.message);
    }
});

// Helper function to copy folder (except excluded files)
function copyFolderSync(source, target) {
    if (!fs.existsSync(target)) fs.mkdirSync(target, { recursive: true });

    const entries = fs.readdirSync(source);
    for (const entry of entries) {
        const src = path.join(source, entry);
        const dest = path.join(target, entry);

        if (['config.js'].includes(entry)) {
            console.log(`⏭️ Skipping ${entry}`);
            continue;
        }

        if (fs.lstatSync(src).isDirectory()) {
            copyFolderSync(src, dest);
        } else {
            fs.mkdirSync(path.dirname(dest), { recursive: true });
            fs.copyFileSync(src, dest);
        }
    }
}
