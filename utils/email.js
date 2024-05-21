const nodemailer = require(`nodemailer`);
const pug = require('pug');
const { convert } = require('html-to-text');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Boris Dimitrijevic <${process.env.EMAIL_FROM}>`;
  }

  createTransport() {
    var transport;
    if (process.env.ENV_NODE === 'production') {
      transport = nodemailer.createTransport({
        host: '',
        port: '',
        auth: {
          user: '',
          pass: '',
        },
      });
    } else {
      transport = nodemailer.createTransport({
        // service
        host: 'sandbox.smtp.mailtrap.io',
        port: 2525,
        auth: {
          user: 'e2f3c47e010096',
          pass: 'a86b71d0b84b74',
        },
      });
    }
    return transport;
  }

  async send(template, subject) {
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject,
    });

    const mailOptions = {
      from: this.from,
      to: this.to,
      html,
      subject,
      text: convert(html),
    };

    await this.createTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Tours family!');
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      `Forgot your password? 
       Visit link:  ${this.url}\nIf u didnt forget your password please ignore this email`
    );
  }
};
