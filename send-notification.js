const webpush = require("web-push");
const fs = require("fs");
const path = require("path");

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:exemplo@exemplo.com";
const SCHEDULE = process.env.SCHEDULE || "";

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

// Qual cron disparou -> qual perfil notificar.
// Precisa bater exatamente com os crons do arquivo .github/workflows/lembrete-treino.yml
const SCHEDULE_MAP = {
  "50 19 * * 1-5": "victor", // 16:50 horário de Brasília
  "30 21 * * 1-5": "kaio",   // 18:30 horário de Brasília
};

async function sendTo(profileId) {
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
  const payload = JSON.stringify({
    title: "Hora do treino!",
    body: "Bora treinar 💪",
  });
  try {
    await webpush.sendNotification(subscription, payload);
    console.log("Notificação enviada para " + profileId);
  } catch (err) {
    console.error("Erro ao enviar para " + profileId + ":", err.statusCode || err.message);
  }
}

async function main() {
  // Rodando manualmente (workflow_dispatch) não tem SCHEDULE -> notifica todo mundo, útil pra testar.
  if (!SCHEDULE) {
    await sendTo("victor");
    await sendTo("kaio");
    return;
  }
  const target = SCHEDULE_MAP[SCHEDULE];
  if (!target) {
    console.log("Cron não reconhecido:", SCHEDULE);
    return;
  }
  await sendTo(target);
}

main();
