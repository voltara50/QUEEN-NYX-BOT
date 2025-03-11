const fs = require('fs');
const path = require('path');
const banFilePath = path.join(__dirname, '../data/ban.json');

// Load or Create Ban List
const loadBanList = () => {
    if (!fs.existsSync(banFilePath)) fs.writeFileSync(banFilePath, '{}');
    return JSON.parse(fs.readFileSync(banFilePath));
};

// Save Ban List
const saveBanList = (banList) => {
    fs.writeFileSync(banFilePath, JSON.stringify(banList, null, 2));
};

// Function to Ban a User
const banUser = async (m, PrexzyVilla) => {
    if (!m.isGroup) return;
    const text = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
    if (!text.startsWith('.ban')) return;
    
    let numberToBan = '';
    
    if (m.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
        numberToBan = m.message.extendedTextMessage.contextInfo.participant.split('@')[0];
    } else if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
        numberToBan = m.message.extendedTextMessage.contextInfo.mentionedJid[0].split('@')[0];
    }

    if (!numberToBan) return PrexzyVilla.sendMessage(m.chat, { text: 'Mention or reply to the user you want to ban.' });

    const banList = loadBanList();
    banList[numberToBan] = true;
    saveBanList(banList);

    await PrexzyVilla.sendMessage(m.chat, {
        text: `🚫 User @${numberToBan} has been banned from sending messages!`,
        contextInfo: { mentionedJid: [`${numberToBan}@s.whatsapp.net`] }
    });
};

// Function to Unban a User
const unbanUser = async (m, PrexzyVilla) => {
    if (!m.isGroup) return;
    const text = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
    if (!text.startsWith('.unban')) return;
    
    let numberToUnban = '';

    if (m.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
        numberToUnban = m.message.extendedTextMessage.contextInfo.participant.split('@')[0];
    } else if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
        numberToUnban = m.message.extendedTextMessage.contextInfo.mentionedJid[0].split('@')[0];
    }

    if (!numberToUnban) return PrexzyVilla.sendMessage(m.chat, { text: 'Mention or reply to the user you want to unban.' });

    const banList = loadBanList();
    delete banList[numberToUnban];
    saveBanList(banList);

    await PrexzyVilla.sendMessage(m.chat, {
        text: `✅ User @${numberToUnban} has been unbanned!`,
        contextInfo: { mentionedJid: [`${numberToUnban}@s.whatsapp.net`] }
    });
};

// Function to Auto-Delete Messages of Banned Users
const checkBannedUsers = async (m, PrexzyVilla) => {
    if (!m.isGroup) return;
    const banList = loadBanList();
    const senderNumber = m.sender.split('@')[0];

    if (banList[senderNumber]) {
        console.log(`🚫 Deleting message from banned user @${senderNumber}`);
        await PrexzyVilla.sendMessage(m.chat, { delete: m.key });
    }
};

// Listen for Ban, Unban & Auto-Delete Messages
module.exports = (PrexzyVilla) => {
    PrexzyVilla.ev.on('messages.upsert', async ({ messages }) => {
        if (!messages || !messages[0]) return;
        const m = messages[0];

        await banUser(m, PrexzyVilla);
        await unbanUser(m, PrexzyVilla);
        await checkBannedUsers(m, PrexzyVilla);
    });
};