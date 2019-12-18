const GLOBAL = require('./global')
const nodemailer = require('nodemailer');
const mail = nodemailer.createTransport({
	service: GLOBAL.MAIL.SVC,
	auth: {
		user: GLOBAL.MAIL.ID,
		pass: GLOBAL.MAIL.PW
	}
});

const take = (text, data) => {
  if (!text) return
  do {
    let start = text.indexOf('[')
    let end = text.indexOf(']')

    if (start !== -1 && end !== -1) {
      let k = text.substring(start + 1, end);
      text = text.split(`[${k}]`).join(data[k])
    } else break;
  } while(true);
  return text;
}

const functions = {
  send: (content, to, data, cb) => {
    mail.sendMail({
      from: GLOBAL.MAIL.ID,
      to: to,
      subject: content.subject,
      text: take(content.text, data)
    }, (err, info) => {
      if (err) throw err;
      if (cb) cb(info);
    })
  }
}

module.exports = functions;