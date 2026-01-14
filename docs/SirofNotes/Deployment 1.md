### Requirement
 - Node.js v22.21.1
 - Postgres v17
 - Google Chrome or Mozila or Opera
 
### Installation 

### 1 - Install Node.js
 - Install Node.js dans le dossier Requirement ==(node-v22.21.1-x64)== (default installation next → next)
 - Pour vérifier que l’installation est succed ouvrir le CMD et éxcuter la commande "node -v" la version installer sera afficher
 - utiliser cette vedio https://www.youtube.com/watch?v=_AW2kcE5VkQ si vous faciez un probléme.
 - 
### 2 - Install Postgres
 - suivre cette vidéo https://www.youtube.com/watch?v=SBEtF7EfY6w pour l’installation.
 - Nous lancons l’excutable ==(postgresql-17.7-2-windows-x64)== dans le dossier Requirement (default installation next → next) just vous serais obligé de crée un mot de passe de la base des données donc mémoriser ce mot de passe par ce que nous avons besoin de ce mot de passe pour déploiyer notre logiciel.
 - dans cette etape vous pouver découcher ==Stack Builder== (Nous la pas besoin)
 ![[Postgres-setup.png]]
 - Dans cette étape entré le mot de pass et mémoriser le pour la prochaine utilisation
 ![[Postgres-password-setup.png]]
 
 - Dans l’étape suivante vous pouvez découcher Stack Builder may be used…
	![[Postgres-finale-setup.png]]

- Lancer le logiciel pgAdmin4
![[pgadmin4.png]]

- Clicker sur Serveurs
![[pgadmin4-servers.png]]
- Vous serez besoin de entre le mot de passe crée présedament dans l’etape d’installation.
![[pgadmin4-password.png]]
- Nous avons besoin aprés de crée notre base de données pour notre logiciel, il sufit de click droite sur Databases → Create → Database, 
![[pgadmin4-db.png]]
- Dans le champ Database entre le nom de la base des donnés ==sirof== (ATTENTION : il fault que le nom soit sirof comme il est écrit dans ce document). clicker sur Save pour sauvgarder les changment.==(notre base des données est installé avec succés)==
![[db-setup.png]]

### 2 - Install le Logiciel

- Copier le dossier next-app dans le Dossier Documents de windows ou bien de le Disque D://.
- ouvrire le fichier .env et modifier la dernier ligne de manier que le mot de pass crée présedament sera remplacer le phrase “badismca20” “postgresql://postgres:==badismca20==@localhost/sirof” et suvgarder les changment
- Lancer le Cmd dans le dossier nex-app que vous avez coller dans Documents ou bien dans le disque D.
- lancer la commande ==npm install== (Vous devez avoir une connexion internet pour cete installation juste 1 fois)
![[npminstall.png]]
- lancer la commande ==‘npx drizzle-kit push’== and chose Yes.
![[pushdbschema.png]]
- lancer la commande ==npm run create-default-user== pour crée l'utilisateur par default:
 email : sirof@gmail.com
 mot de passe : Sirof2025@

- lancer la commande ==npm run build==
![[npmrunbuild.png]]
- to verify all is good lancer la commande ==npm run start==
 ![[npmrunstart.png]]
 - visiter le lien [http://localhost:3000/sign-in](http://localhost:3000/sign-in)
 - entrer le compte par défault crée déja vous serez donc dans le logiciel.