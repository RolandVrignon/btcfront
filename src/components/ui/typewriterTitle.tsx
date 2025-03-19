import React from "react";
import { Typewriter } from "./typewriter";

interface TypewriterTitleProps {
  name?: string;
  className?: string;
}

export const TypewriterTitle: React.FC<TypewriterTitleProps> = ({
  className,
}) => {
  const text = [
    "> Nous recherchons votre projet 🔍",
    "> Hmm où se trouve-t-il ? 🤔",
    "> Recherche de la ville en cours 🏙️",
    "> Analyse des données géographiques 🗺️",
    "> Recherche de l'adresse en cours 🏠",
    "> Vérification des coordonnées GPS 📍",
    "> Ah très bien, on a des infos ✨",
    "> Qui est le rédacteur du projet ? 📝",
    "> Recherche des contributeurs 👥",
    "> Ah super, on l'a trouvé ! 🎉",
    "> Examen des spécifications techniques 🔧",
    "> Analyse du cahier des charges 📊",
    "> Évaluation du budget prévisionnel 💰",
    "> Vérification des délais d'exécution ⏱️",
    "> Recherche des partenaires impliqués 🤝",
    "> Analyse des risques potentiels ⚠️",
    "> Évaluation de la faisabilité 🧮",
    "> Examen des contraintes réglementaires 📜",
    "> Recherche des autorisations nécessaires 🔐",
    "> Compilation des résultats 📂",
    "> Préparation du rapport final 📄",
    "> Presque terminé, un instant ⌛",
    "> Voilà, toutes les informations sont prêtes ! 🚀",
  ];

  return (
    <Typewriter
      text={text}
      speed={70}
      className={`${className || ""}`}
      waitTime={1500}
      deleteSpeed={40}
      cursorChar={"_"}
    />
  );
};
