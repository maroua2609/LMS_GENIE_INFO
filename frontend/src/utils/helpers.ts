export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatDateTime = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getInitials = (nom: string, prenom: string): string => {
  return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
};

export const truncate = (text: string, length: number): string => {
  return text.length > length ? `${text.substring(0, length)}...` : text;
};

export const calculateProgressWidth = (progress: number): number => {
  return Math.min(Math.max(progress, 0), 100);
};
