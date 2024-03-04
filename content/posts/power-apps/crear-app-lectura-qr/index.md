---
title: Crear App que lee codigo QR
cover: ./cover.jpeg
date: 2024-03-03
tags: ['post', 'tutoriales', 'power apps']
---

Con estos simples pasos podemos crear una App para leer codigos QR desde el Cel y tratar esos datos.

Podemos pensar en diferentes casos de uso:

* Ser para guardarlos en una base de datos o comparados con alguna ya exitente para permitir el ingreso a alguna instalacion.
* Disparar algun trigger de Power Automate que genere acciones de acuerdo a los datos leidos.
* Registrar el horario de entrada de un empleado en la compañía.
* Hacer algun tipo de reconocimiento o validacion con la lectura obtenida.

Lo primero es crear la aplicacion:

![Creacion de App](1.png "Creacion de App")

Seleccionamos Blank Canva App:

![Blank Canva App](2.png "Blank Canva App")

Seleccionamos la siguiente configuracion:

![config](3.png "config")

Insertamos el control de lectura de codigo de barras desde el memu multimedia:

![control lectura codigo de barras](4.png "control lectura codigo de barras")

Esto nos creará un boton llamado **BarcodeReader1**, podemos ponerle la siguiente configuración:

![configuracion control lectura de codigo de barras](5.png "configuracion control lectura de codigo de barras")

Podemos crear un label y hacerlo invisible con el objetivo de guardar los datos de la lectura del QR de manera temporal (en el caso de que los datos sean alfanumericos) y posteriormente tratarlos segun la necesidad.

Suponiendo que nuestro label se llama: **lbl_data**, en su propiedad `Text` configuramos la siguiente función:

```
First(BarcodeReader1.Barcodes).Value
```

Con esto cada vez que leamos el codigo QR, su contenido se guardará en el label **lbl_data**

Para la prueba podemos agregar `una base de datos Dataverse` y elegir la tabla `Cuentas`.

Configuramos la siguiente función en el control **BarcodeReader1** en su propiedad `OnSelect`:

```
Patch(Cuentas; Defaults(Cuentas); {'Nombre de cuenta':lbl_data.Text});;
```

Con lo anterior, en el campo por defecto `nombre de cuenta` de la tabla `Cuentas`. quedara la informacion que obtuvimos de la lectura del codigo QR, sea un link, un nombre, un correo o alguna informacion en JSON por ejemplo que pongan en el QR

Publicamos y a probar desde nuestro celular.

> pueden probarla con esta pagina que permite crear codigos QR con cualquier tipo de informacion: https://qr.io/es/
