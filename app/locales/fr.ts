import { SubmitKey } from "../store/config";
import type { PartialLocaleType } from "./index";

const fr: PartialLocaleType = {
  WIP: "Prochainement...",
  Error: {
    Unauthorized:
      "Accès non autorisé, veuillez saisir le code d'accès dans la page des paramètres.",
  },
  Sidebar: {
    Title: "公告",
    Close: "关闭",
  },
  ChatItem: {
    ChatItemCount: (count: number) => `${count} messages en total`,
  },
  Chat: {
    SubTitle: (count: number) => `${count} messages échangés avec ChatGPT`,
    Actions: {
      ChatList: "Aller à la liste de discussion",
      CompressedHistory: "Mémoire d'historique compressée Prompt",
      Export: "Exporter tous les messages en tant que Markdown",
      Copy: "Copier",
      Stop: "Arrêter",
      Retry: "Réessayer",
      Delete: "Supprimer",
    },
    Rename: "Renommer la conversation",
    Typing: "En train d'écrire…",
    Input: (submitKey: string) => {
      var inputHints = `Appuyez sur ${submitKey} pour envoyer`;
      if (submitKey === String(SubmitKey.Enter)) {
        inputHints += ", Shift + Enter pour insérer un saut de ligne";
      }
      return inputHints + ", / pour rechercher des prompts";
    },
    Send: "Envoyer",
    Config: {
      Reset: "Restaurer les paramètres par défaut",
      SaveAs: "Enregistrer en tant que masque",
    },
  },
  Export: {
    Title: "Tous les messages",
    Copy: "Tout sélectionner",
    Download: "Télécharger",
    MessageFromYou: "Message de votre part",
    MessageFromChatGPT: "Message de ChatGPT",
  },
  Memory: {
    Title: "Prompt mémoire",
    EmptyContent: "Rien encore.",
    Send: "Envoyer la mémoire",
    Copy: "Copier la mémoire",
    Reset: "Réinitialiser la session",
    ResetConfirm:
      "La réinitialisation supprimera l'historique de la conversation actuelle ainsi que la mémoire de l'historique. Êtes-vous sûr de vouloir procéder à la réinitialisation?",
  },
  Home: {
    NewChat: "Nouvelle discussion",
    DeleteChat: "Confirmer la suppression de la conversation sélectionnée ?",
    DeleteToast: "Conversation supprimée",
    Revert: "Revenir en arrière",
    NoNotice: "暂无公告",
  },
  Settings: {
    Title: "Paramètres",
    SubTitle: "Toutes les configurations",

    Lang: {
      Name: "Language", // ATTENTION : si vous souhaitez ajouter une nouvelle traduction, ne traduisez pas cette valeur, laissez-la sous forme de `Language`
      All: "Toutes les langues",
    },

    Avatar: "Avatar",
    FontSize: {
      Title: "Taille des polices",
      SubTitle: "Ajuste la taille de police du contenu de la conversation",
    },
    Update: {
      Version: (x: string) => `Version : ${x}`,
      IsLatest: "Dernière version",
      CheckUpdate: "Vérifier la mise à jour",
      IsChecking: "Vérification de la mise à jour...",
      FoundUpdate: (x: string) => `Nouvelle version disponible : ${x}`,
      GoToUpdate: "Mise à jour",
    },
    SendKey: "Clé d'envoi",
    Theme: "Thème",
    TightBorder: "Bordure serrée",
    SendPreviewBubble: {
      Title: "Aperçu de l'envoi dans une bulle",
      SubTitle: "Aperçu du Markdown dans une bulle",
    },
    Mask: {
      Title: "Écran de masque",
      SubTitle:
        "Afficher un écran de masque avant de démarrer une nouvelle discussion",
    },
    Prompt: {
      Disable: {
        Title: "Désactiver la saisie semi-automatique",
        SubTitle: "Appuyez sur / pour activer la saisie semi-automatique",
      },
      List: "Liste de prompts",
      ListCount: (builtin: number, custom: number) =>
        `${builtin} intégré, ${custom} personnalisé`,
      Edit: "Modifier",
      Modal: {
        Title: "Liste de prompts",
        Add: "Ajouter un élément",
        Search: "Rechercher des prompts",
      },
      EditModal: {
        Title: "Modifier le prompt",
      },
    },
    HistoryCount: {
      Title: "Nombre de messages joints",
      SubTitle: "Nombre de messages envoyés attachés par demande",
    },
    CompressThreshold: {
      Title: "Seuil de compression de l'historique",
      SubTitle:
        "Comprimera si la longueur des messages non compressés dépasse cette valeur",
    },
    Token: {
      Title: "Clé API",
      SubTitle: "Utilisez votre clé pour ignorer la limite du code d'accès",
      Placeholder: "Clé OpenAI API",
    },
    Usage: {
      Title: "Solde du compte",
      SubTitle(used: any, total: any) {
        return `Épuisé ce mois-ci $${used}, abonnement $${total}`;
      },
      IsChecking: "Vérification...",
      Check: "Vérifier",
      NoAccess: "Entrez la clé API pour vérifier le solde",
    },
    AccessCode: {
      Title: "Code d'accès",
      SubTitle: "Contrôle d'accès activé",
      Placeholder: "Code d'accès requis",
    },
    Model: "Modèle",
    Temperature: {
      Title: "Température",
      SubTitle: "Une valeur plus élevée rendra les réponses plus aléatoires",
    },
    MaxTokens: {
      Title: "Max Tokens",
      SubTitle: "Longueur maximale des tokens d'entrée et des tokens générés",
    },
    PresencePenalty: {
      Title: "Pénalité de présence",
      SubTitle:
        "Une valeur plus élevée augmentera la probabilité d'introduire de nouveaux sujets",
    },
    FrequencyPenalty: {
      Title: "Pénalité de fréquence",
      SubTitle:
        "Une valeur plus élevée diminuant la probabilité de répéter la même ligne",
    },
  },
  Store: {
    DefaultTopic: "Nouvelle conversation",
    BotHello: "Bonjour ! Comment puis-je vous aider aujourd'hui ?",
    Error: "Quelque chose s'est mal passé, veuillez réessayer plus tard.",
    Prompt: {
      History: (content: string) =>
        "Ceci est un résumé de l'historique des discussions entre l'IA et l'utilisateur : " +
        content,
      Topic:
        "Veuillez générer un titre de quatre à cinq mots résumant notre conversation sans introduction, ponctuation, guillemets, points, symboles ou texte supplémentaire. Supprimez les guillemets inclus.",
      Summarize:
        "Résumez brièvement nos discussions en 200 mots ou moins pour les utiliser comme prompt de contexte futur.",
    },
  },
  Copy: {
    Success: "Copié dans le presse-papiers",
    Failed:
      "La copie a échoué, veuillez accorder l'autorisation d'accès au presse-papiers",
  },
  Context: {
    Toast: (x: any) => `Avec ${x} contextes de prompts`,
    Edit: "Contextes et mémoires de prompts",
    Add: "Ajouter un prompt",
  },
  Plugin: {
    Name: "Extension",
  },
  Mask: {
    Name: "Masque",
    Page: {
      Title: "Modèle de prompt",
      SubTitle: (count: number) => `${count} modèles de prompts`,
      Search: "Rechercher des modèles",
      Create: "Créer",
    },
    Item: {
      Info: (count: number) => `${count} prompts`,
      Chat: "Discussion",
      View: "Vue",
      Edit: "Modifier",
      Delete: "Supprimer",
      DeleteConfirm: "Confirmer la suppression?",
    },
    EditModal: {
      Title: (readonly: boolean) =>
        `Modifier le modèle de prompt ${readonly ? "(en lecture seule)" : ""}`,
      Download: "Télécharger",
      Clone: "Dupliquer",
    },
    Config: {
      Avatar: "Avatar du bot",
      Name: "Nom du bot",
    },
  },
  NewChat: {
    Return: "Retour",
    Skip: "Passer",
    Title: "Choisir un masque",
    SubTitle: "Discutez avec l'âme derrière le masque",
    More: "En savoir plus",
    NotShow: "Ne pas afficher à nouveau",
    ConfirmNoShow:
      "Confirmez-vous vouloir désactiver cela? Vous pouvez le réactiver plus tard dans les paramètres.",
  },

  UI: {
    Confirm: "Confirmer",
    Cancel: "Annuler",
    Close: "Fermer",
    Create: "Créer",
    Edit: "Éditer",
  },
  Exporter: {
    Model: "Modèle",
    Messages: "Messages",
    Topic: "Sujet",
    Time: "Temps",
  },
};

export default fr;
