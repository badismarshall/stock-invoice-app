- ~~Need a startup dashboard app~~
- ~~make a dashboard layout~~
- ~~Make a side-bare~~
- Remove drizle-postgres package (because we be gona use Mysql in prod)
- Remove postfres package
- ~~We focus on ==clients and fournisseur==~~
- /purchases/page.tsx
	- ~~Ajouter dans le popover de column actions le status (pour que le client puisse change le status de l’achat)~~
	- ~~lorsque la suppression de l’achat il fault géré le stock.~~
	- add print reception achat.
- ajouter la fonction d’envoi en email
- les prix des produits en DZD et EURO
- ~~add search with client in the advanced filters like the search with status in /sales/page.tsx~~
- ~~Add actions in the table of the /sales/page.tsx (modify and delete) (status changes also)~~
- ~~Add print facture et BL~~
- dans le filtrage we need to add helper function to calculate the totle client, status so we can render a number like we do in /users/page.tsx
- ~~Build /sales/modify/[id]/page.tsx to modify the sale (like we do it in the purchase)~~
- Test /sales/modify/[id]/page.tsx
- verify the calcule of totale amounts in all the dashboard (avoid heavy calcul)
- ~~Add /deleviry-notes-cancelation/page.tsx for listing the canclation.~~
- ~~Modify the way how we cancele the sale. (IMPORTANT)~~
- ~~We make the changes on delivery_note_cancelation (schema and way to do the cancelation)~~
- ~~add modify client and fournisseur (delete also)~~
- ~~fix search with phone in client-suppliers page.tsx~~
- Maybe we need to work on purchase_cancelation 
- remove sale_locle from enums
- ~~add print bon livraison avoir (delivery_note_cancelation)~~
- add role based system
- in the list of the delivry notes items we dont let the user to modify the delivery note cancelation items (only read).
- ~~Add export PDF,XSLX in sales and purchases~~
- ~~Add export PDF,XSLX in Export~~
~~==- **Very Important**== : we need to optimize the db calls in  dashboard/export/delivery-notes because it’s to heavy and the page need to be load fast.~~
- ~~add a lazy load in select product in add purchase and add sale.~~
==- fix send email in the prod==
- Add lazy load in the client input /dashboard/delivery-notes-cancellation/new and /dashboard/export/delivery-notes-cancellation
- add export (xslx, pdf) selected item ( sales, export …etc) only
- add a loading when click in export pdf or export xslx, for better user exprience espacily when we have a lot of lignes (sales, export …etc) the app take a time to generate the desired file.
- add export pdf, xslx in the export module
- changer la generation du numéro d'annulation (que les chiffre et no pas les letter)
- add another fields for filtring
- the canceled delivry_notes doesn't have the print invoice button
- add another section for only f acture proforma
==- Very Important== : Create another git branch for adding Mysql compatiblity
- delete all the count in the filtring toolbar
- there is a modify adjustment page we need to modfiy the form (/dashboard/stock/movement/modify/[id])
- ~~there is no purchase facture~~
- add devise in /dashboard/purchases/modify/[id]
- ==check all the export module==
- ==check all the vente module==
- We need to work on history of stock with product
- we need to work on the add product in the /new pages so the user can search with name and the code of the product and add a lazy load maybe.
- ~~remove the paye de destination on the facture de proforma~~
- Work on export modification DN 
- ~~in /dashboard/invoices/new add currency, delete the proforma from the type~~
- we need to add the currency in the ourchace 
## Informations
 - Nodejs v24
 - PostgressSQl version 13

## Tech Stack
- Nextjs 16 
- Mysql
- drizzle ORM
- Shadcnui
- Better-Auth (Auth)

## Deployement
- Fix send email 

