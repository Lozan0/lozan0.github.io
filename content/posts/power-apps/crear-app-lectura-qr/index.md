---
title: Crear App que lee codigo QR
cover: ./cover.jpeg
date: 2024-03-03
tags: ['post', 'tutoriales', 'power apps']
---

Creamos la aplicacion:

![Creacion de App](1.png "Creacion de App")

Seleccionamos Blank Canva App:

![Blank Canva App](2.png "Blank Canva App")

Seleccionamos la siguiente configuracion:

![config](3.png "config")

Insertamos el control de lectura de codigo de barras desde el memu multimedia:

![control lectura codigo de barras](4.png "control lectura codigo de barras")

Esta es la configuarion del control:

![configuracion control lectura de codigo de barras](5.png "configuracion control lectura de codigo de barras")

Label en text: First(BarcodeReader1.Barcodes).Value

Agregamos una base de datos Dataverse cuentas:

y en el campo por defecto nombre de cuenta quedara la informacion que nos de el codigo QR, sea un link, un nombre, un correo o alguna informacion en JSON por ejemplo que pongan en el QR

OnSelect del barcode1: Patch(Cuentas; Defaults(Cuentas); {'Nombre de cuenta':Label3.Text});;

Publicamos y a probar desde nuestro celular.

pueden probarla con esta pagina que permite crear codigos QR con cualquier tipo de informacion: https://qr.io/es/


