module.exports = { mail };
//const nodemailer = require("nodemailer");
function mail(email, username, code, bcode){
    var nodemailer = require('nodemailer');
    var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
    user: 'smtp.testwebsite@gmail.com',
    pass: 'nqtczeqocpnvfosk'
    }
    })
    var mailOptions = {
    from: '"GIP e-mail verificatie" smtp.testwebsite@gmail.com',
    to: email,
    subject: 'Verifiëer uw e-mail adres',
    html: ` <h1 >GIP email verificatie</h1>
    <br>
    <p>Hallo, `+username+`!</p>
    <br><br>
    <p>Deze e-mail is verzonden ter verificatie van uw Wi-Fi account. Dit is de code van uw leerlingenkaart:</p>
    <h2>`+bcode+`</h2>
    <p>Als deze code overeenkomt met de code op uw leerlingkaart en u een account wilt aanmaken, klik dan hieronder:</p>
    <a href="https://gip.jerkolannoo.com/register/verify-email?code=`+code+`&email=`+email+`">Verifiëren</a>
    <br>
    <br>
    <p>Als de code niet overeenkomt of als u <b>geen</b> account wilt aanmaken, negeer deze e-mail dan.</p>
    <br><br>
    <p>Het GIP Wi-Fi systeem</p>
    <br>
    <p style="font-size: small; font-style: italic;">Dit is een automatisch verzonden email, reageer hier niet op.</p>
    <style>
        *{
            font-family: Arial, Helvetica, sans-serif;
        }
        h1{
            text-align: center;
        }
        a{
            color: white;
            text-decoration: none;
            background-color: #035dfc;
            cursor: pointer;
            padding: 5px;
            border-style: none;
            border-radius: 5px;
        }
    </style>`,
    /* attachments: [{
    filename: 'label: ' + trackingNr + ".PDF",
    path: '/var/www/html/label.pdf',
    //contentType: 'application/pdf'
    }],*/
    };
    transporter.sendMail(mailOptions, function(error, info){
    if (error) {
    console.log(error);
    } else {
    console.log('Email sent: ' + info.response);
    //  resolve();
    }
    });
}
