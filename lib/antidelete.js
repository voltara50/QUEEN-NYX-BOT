const fs = require('fs');

const settingsPath = './data/antidelete.json';

// Load & save settings
const loadSettings = () => {
    if (!fs.existsSync(settingsPath)) fs.writeFileSync(settingsPath, JSON.stringify({ enabled: true }));
    return JSON.parse(fs.readFileSync(settingsPath));
};
const saveSettings = (settings) => fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));

// Toggle antidelete
const toggleAntidelete = async (m, PrexzyVilla) => {
    let settings = loadSettings();
    let command = m.text.split(" ")[1]?.toLowerCase();

    if (command === "on") {
        settings.enabled = true;
        saveSettings(settings);
        return PrexzyVilla.sendMessage(m.chat, { text: "✅ *Antidelete is now ENABLED.*\nDeleted messages will be recovered and sent to the deployer's DM." }, { quoted: m });
    } else if (command === "off") {
        settings.enabled = false;
        saveSettings(settings);
        return PrexzyVilla.sendMessage(m.chat, { text: "❌ *Antidelete is now DISABLED.*" }, { quoted: m });
    } else {
        return PrexzyVilla.sendMessage(m.chat, { text: "⚙️ *Usage:*\n.antidelete on → Enable\n.antidelete off → Disable" }, { quoted: m });
    }
};

// Listen for deleted messages
const watchDeletedMessages = (PrexzyVilla) => {
    PrexzyVilla.ev.on('messages.update', async (event) => {
        let settings = loadSettings();
        if (!settings.enabled) return; // If disabled, do nothing

        for (let { key, update } of event) {
            if (update.messageStubType === 1) { // 1 = deleted message
                let deletedMessage = await PrexzyVilla.loadMessage(key.remoteJid, key.id).catch(() => null);
                if (!deletedMessage) return;

                let sender = key.participant || key.remoteJid;
                let isGroup = key.remoteJid.endsWith('@g.us');
                let chatName = isGroup ? "Group Chat" : "Private Chat";
                let content = deletedMessage.message?.conversation || "[Media File]";
                let messageType = Object.keys(deletedMessage.message || {})[0];

                let recoveryMessage = `🚨 *Deleted Message Recovered!*\n\n👤 *Sender:* @${sender.split('@')[0]}\n📍 *From:* ${chatName}\n📩 *Message Type:* ${messageType}\n🗑️ *Recovered Message:*\n${content}`;

                let ownerJid = global.ownernumber[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
                await PrexzyVilla.sendMessage(ownerJid, { text: recoveryMessage, mentions: [sender] });
            }
        }
    });
};

// Export functions
module.exports = {
    toggleAntidelete,
    watchDeletedMessages
};