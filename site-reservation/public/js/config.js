// Réglages du commerce : c'est le seul fichier à modifier pour un nouveau client.
// Il est utilisé à la fois par le site (navigateur) et par le serveur.

export const CONFIG = {
  businessName: "L'Atelier Barbier",
  // Langue par défaut du site : 'fr' ou 'en' (le visiteur peut changer avec le bouton FR / EN)
  defaultLanguage: 'fr',
  currency: '€',
  phone: '+33100000000',
  phoneDisplay: '01 00 00 00 00',
  address: { fr: "12 rue de l'Exemple, 00000 Ville", en: '12 Example Street, 00000 Town' },

  // Précision des créneaux proposés (en minutes)
  slotStep: 15,
  // Jusqu'à combien de jours à l'avance on peut réserver
  daysAhead: 21,
  // Délai minimum avant un rendez-vous (en minutes)
  minNoticeMinutes: 60,

  services: [
    // name et description : un texte simple, ou { fr: '...', en: '...' } pour un site bilingue
    {
      id: 'coupe', duration: 30, price: 25,
      name: { fr: 'Coupe homme', en: "Men's haircut" },
      description: { fr: 'Shampoing, coupe, coiffage.', en: 'Wash, cut and styling.' },
    },
    {
      id: 'barbe', duration: 20, price: 18,
      name: { fr: 'Taille de barbe', en: 'Beard trim' },
      description: { fr: 'Contours au rasoir, huile et baume.', en: 'Razor line-up, oil and balm.' },
    },
    {
      id: 'coupe-barbe', duration: 50, price: 38,
      name: { fr: 'Coupe + barbe', en: 'Haircut + beard' },
      description: { fr: 'La formule complète.', en: 'The full package.' },
    },
    {
      id: 'degrade', duration: 40, price: 28,
      name: { fr: 'Dégradé américain', en: 'Skin fade' },
      description: { fr: 'Fondu précis, finitions au rasoir.', en: 'Precise fade, razor finish.' },
    },
    {
      id: 'rasage', duration: 35, price: 30,
      name: { fr: 'Rasage traditionnel', en: 'Hot towel shave' },
      description: { fr: 'Serviette chaude, rasoir droit.', en: 'Hot towel, straight razor.' },
    },
    {
      id: 'enfant', duration: 20, price: 18,
      name: { fr: 'Coupe enfant', en: 'Kids haircut' },
      description: { fr: "Jusqu'à 12 ans.", en: 'Up to 12 years old.' },
    },
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
