# Backend API

## Installation

Créer un environnement Python virtuel, installer les dépendances de requirements.txt, puis lancer le serveur avec la commande uvicorn main:app --reload --port 8000 depuis le dossier backend.

L’API accepte les fichiers .xlsb, .xlsx et .xls pour l’aperçu. Le fichier est stocké temporairement pour être lu, puis supprimé. Le fichier source n’est jamais écrasé. Cette version inspecte uniquement la première feuille et ne transforme ni n’exporte encore le rapport.