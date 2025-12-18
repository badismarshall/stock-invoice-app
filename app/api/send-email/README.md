# Configuration Email

Cette route API permet d'envoyer des factures par email.

## Configuration

### Mode Développement

En mode développement, les emails sont simplement loggés dans la console. Aucune configuration n'est nécessaire.

### Mode Production

Pour envoyer des emails en production, vous devez configurer un service d'email. Voici deux options :

#### Option 1: Nodemailer (SMTP)

1. Installer nodemailer :

```bash
npm install nodemailer
npm install --save-dev @types/nodemailer
```

2. Ajouter les variables d'environnement dans `.env.local` :

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre-email@gmail.com
SMTP_PASSWORD=votre-mot-de-passe-app
SMTP_FROM=votre-email@gmail.com
```

3. Décommenter le code nodemailer dans `route.ts`

#### Option 2: Resend (Recommandé)

1. Installer Resend :

```bash
npm install resend
```

2. Obtenir une clé API depuis https://resend.com

3. Ajouter dans `.env.local` :

```
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@votredomaine.com
```

4. Décommenter le code Resend dans `route.ts`

## Utilisation

L'email est automatiquement envoyé depuis la page d'impression de facture lorsque l'utilisateur clique sur "Envoyer par email".

L'email contient :

- Les informations de l'entreprise
- Les détails de la facture
- Le tableau des produits
- Les totaux (HT, TVA, TTC)
- Les notes si présentes
