// Réglages du commerce : c'est le seul fichier à modifier pour un nouveau client.
// Il est utilisé à la fois par le site (navigateur) et par le serveur.

export const CONFIG = {
  businessName: "L'Atelier Barbier",
  phone: '+33100000000',
  phoneDisplay: '01 00 00 00 00',
  address: "12 rue de l'Exemple, 00000 Ville",

  // Précision des créneaux proposés (en minutes)
  slotStep: 15,
  // Jusqu'à combien de jours à l'avance on peut réserver
  daysAhead: 21,
  // Délai minimum avant un rendez-vous (en minutes)
  minNoticeMinutes: 60,

  services: [
    { id: 'coupe', name: 'Coupe homme', duration: 30, price: 25, description: 'Shampoing, coupe, coiffage.' },
    { id: 'barbe', name: 'Taille de barbe', duration: 20, price: 18, description: 'Contours au rasoir, huile et baume.' },
    { id: 'coupe-barbe', name: 'Coupe + barbe', duration: 50, price: 38, description: 'La formule complète.' },
    { id: 'degrade', name: 'Dégradé américain', duration: 40, price: 28, description: 'Fondu précis, finitions au rasoir.' },
    { id: 'rasage', name: 'Rasage traditionnel', duration: 35, price: 30, description: 'Serviette chaude, rasoir droit.' },
    { id: 'enfant', name: 'Coupe enfant', duration: 20, price: 18, description: "Jusqu'à 12 ans." },
  ],

  // Horaires par jour (0 = dimanche, 1 = lundi...). Plusieurs plages = pause déjeuner.
  hours: {
    0: [['09:00', '13:00']],
    1: [],
    2: [['09:00', '12:30'], ['13:30', '19:00']],
    3: [['09:00', '12:30'], ['13:30', '19:00']],
    4: [['09:00', '12:30'], ['13:30', '20:00']],
    5: [['09:00', '12:30'], ['13:30', '20:00']],
    6: [['08:30', '13:00'], ['14:00', '18:00']],
  },

  // Jours de fermeture exceptionnelle (congés, jours fériés) au format AAAA-MM-JJ
  closedDates: ['2026-12-25', '2027-01-01'],
};
