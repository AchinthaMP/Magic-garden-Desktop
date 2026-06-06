const DiscordRPC = require('discord-rpc');

const CLIENT_ID = '1512814560661344457';

let rpc = null;
let connected = false;
let startTime = 0;
let retryTimer = null;

function connect() {
  if (connected || rpc) return;

  try {
    rpc = new DiscordRPC.Client({ transport: 'ipc' });

    rpc.on('ready', () => {
      connected = true;
      startTime = Date.now();
      setActivity();
    });

    rpc.on('disconnected', () => {
      connected = false;
      rpc = null;
    });

    rpc.login({ clientId: CLIENT_ID }).catch(() => {
      connected = false;
      rpc = null;
    });
  } catch (e) {
    connected = false;
    rpc = null;
  }
}

function setActivity() {
  if (!rpc || !connected) return;

  rpc.setActivity({
    details: 'Farming on Magic Garden',
    startTimestamp: startTime,
    largeImageKey: 'logo',
    largeImageText: 'Magic Garden',
    instance: false,
    buttons: [
      { label: 'Play Magic Garden', url: 'https://magicgarden.gg/' }
    ]
  }).catch(() => {});
}

function disconnect() {
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
  if (rpc) {
    rpc.destroy().catch(() => {});
    rpc = null;
  }
  connected = false;
}

module.exports = { connect, disconnect };
