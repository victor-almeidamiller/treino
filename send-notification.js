const webpush = require("web-push");
const fs = require("fs");
const path = require("path");

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:exemplo@exemplo.com";
const MESSAGE = process.env.MESSAGE || "";

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

// Textos de cada lembrete.
const MESSAGES = {
  bomdia: {
    title: "Bom dia!",
    body: "Vamos nos alimentar bem e beber bastante água! ☀️💦",
  },
  almoco: {
    title: "Hora do almoço!",
    body: "Temos que nos alimentar para ter força durante todo o dia! 🥗",
  },
  treino: {
    title: "Hora do treino!",
    body: "💪 Bora treinar!",
  },
};

async function sendTo(profileId, messageKey) {
  const file = path.join(__dirname, "subscriptions", profileId + ".json");
  if (!fs.existsSync(file)) {
    console.log("Sem inscrição salva para " + profileId + ", pulando.");
    return;
  }
  const raw = fs.readFileSync(file, "utf8").trim();
  if (!raw) {
    console.log("Arquivo de inscrição de " + profileId + " está vazio, pulando.");
    return;
  }
  const subscription = JSON.parse(raw);
  const msg = MESSAGES[messageKey];
  const payload = JSON.stringify({ title: msg.title, body: msg.body });
  try {
    await webpush.sendNotification(subscription, payload);
    console.log("Notificação (" + messageKey + ") enviada para " + profileId);
  } catch (err) {
    console.error("Erro ao enviar para " + profileId + ":", err.statusCode || err.message);
  }
}

async function sendToBoth(messageKey) {
  await sendTo("victor", messageKey);
  await sendTo("kaio", messageKey);
}

async function main() {
  // Chamada do cron-job.org informando exatamente qual mensagem mandar.
  if (MESSAGES[MESSAGE]) {
    await sendToBoth(MESSAGE);
    return;
  }
  // Rodando manualmente sem nada especificado -> testa as 3 mensagens, pros dois.
  for (const key of Object.keys(MESSAGES)) {
    await sendToBoth(key);
  }
}

main();
