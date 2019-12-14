/**
 * Rule the words! KKuTu Online
 * Copyright (C) 2017 JJoriping(op@jjo.kr)
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

const MainDB	 = require("../db");
const JLog	 = require("../../sub/jjlog");
// const Ajae	 = require("../../sub/ajaejs").checkAjae;
const passport = require('passport');
const glob = require('glob-promise');
const GLOBAL	 = require("../../sub/global.json");
const config = require('../../sub/auth.json');
const path = require('path')
const mailer = require('../../sub/mailer');

function process(req, accessToken, MainDB, $p, done) {
    $p.token = accessToken;
    $p.sid = req.session.id;

    let now = Date.now();
    $p.sid = req.session.id;
    req.session.admin = GLOBAL.ADMIN.includes($p.id);
    req.session.authType = $p.authType;
    MainDB.session.upsert([ '_id', req.session.id ]).set({
        'profile': $p,
        'createdAt': now
    }).on();
    MainDB.users.findOne([ '_id', $p.id ]).on(($body) => {
        req.session.profile = $p;
        MainDB.users.update([ '_id', $p.id ]).set([ 'lastLogin', now ]).on();
    });

    done(null, $p);
}

function genTok(len) {
		const chars = '!@$%^*()_+1234567890-qwertyuiop[]{}asdfghjklzxcvbnm,./';
		let result = ''
		for (i = 0; i < len; i++) result += chars[Math.floor(Math.random() * chars.length)]
		return result
}

exports.run = (Server, page) => {
    //passport configure
    passport.serializeUser((user, done) => {
        done(null, user);
    });

    passport.deserializeUser((obj, done) => {
        done(null, obj);
    });

    const strategyList = {};
    
	for (let i in config) {
		try {
			let auth = require(path.resolve(__dirname, '..', 'auth', 'auth_' + i + '.js'))
			Server.get('/login/' + auth.config.vendor, passport.authenticate(auth.config.vendor))
			Server.get('/login/' + auth.config.vendor + '/callback', passport.authenticate(auth.config.vendor, {
				successRedirect: '/',
				failureRedirect: '/loginfail'
			}))
			passport.use(new auth.config.strategy(auth.strategyConfig, auth.strategy(process, MainDB /*, Ajae */)));
			strategyList[auth.config.vendor] = {
				vendor: auth.config.vendor,
				displayName: auth.config.displayName,
				color: auth.config.color,
				fontColor: auth.config.fontColor
			};

			JLog.info(`OAuth Strategy ${i} loaded successfully.`)
		} catch (error) {
			JLog.error(`OAuth Strategy ${i} is not loaded`)
			JLog.error(error.message)
		}
	}
	
	Server.get("/login", (req, res) => {
		if(global.isPublic){
			page(req, res, "login", { '_id': req.session.id, 'text': req.query.desc, 'loginList': strategyList});
		}else{
			let now = Date.now();
			let id = req.query.id || "ADMIN";
			let lp = {
				id: id,
				title: "LOCAL #" + id,
				birth: [ 4, 16, 0 ],
				_age: { min: 20, max: undefined }
			};
			MainDB.session.upsert([ '_id', req.session.id ]).set([ 'profile', JSON.stringify(lp) ], [ 'createdAt', now ]).on(function($res){
				MainDB.users.update([ '_id', id ]).set([ 'lastLogin', now ]).on();
				req.session.admin = true;
				req.session.profile = lp;
				res.redirect("/");
			});
		}
	});

	Server.get("/register", (req, res) => {
		if(req.session.profile){
			return res.redirect("/");
		} else {
			page(req, res, "register");
		}
	});

	Server.post("/register", (req, res) => {
		if(req.session.profile){
			return res.send({ err: 'logged_in' });
		} else {
			const token = genTok(20);
			MainDB.users.upsert([ '_id', req.body.id ]).set(
				[ 'kkutu', { email: req.body.email, verifyed: false, eToken: token } ],
				[ 'box', {} ],
				[ 'equip', {} ],
				[ 'password', req.body.pw ],
				[ 'friends', {} ]
			).on(function($res) {
				mailer.send(GLOBAL.MAIL.CONTENT, req.body.email, { domain: GLOBAL.DOMAIN, token: token });
				return res.send({ ok: true });
			});
		}
	});

	Server.get("/verify", (req, res) => {
		if (!req.query.token) return res.send({ err: 'invalid query' });
		MainDB.users.direct(`SELECT * FROM users WHERE kkutu->>'eToken' = '${req.query.token}'`, function(err, $body) {
			if (err) return res.send({ err: err });
			const $user = $body.rows[0];
			if (!$user) return res.send({ err: 'invalid token' });
			else if ($user.kkutu.verifyed) return res.send({ err: 'already verifyed email' });
			
			MainDB.users.direct(`UPDATE users SET kkutu = jsonb_set(CAST(kkutu AS JSONB), '{verifyed}', 'true') WHERE _id = '${$user._id}'`);
			if (req.session.profile) res.redirect('/logout');
			else res.redirect('/login');
		});
	});

	Server.post("/getDupl", (req, res) => {
		if (req.body.id) {
			MainDB.users.findOne([ '_id', req.body.id ]).on($user => {
				if ($user) return res.send({ exist: true })
				return res.send({ exist: false })
			})
		} else if (req.body.email) {
			MainDB.users.direct(`SELECT * FROM users WHERE kkutu->>'email' = '${req.body.email}'`, (err, $user) => {
				if (err) return res.send({ err: err })
				if ($user.rows[0]) return res.send({ exist: true })
				return res.send({ exist: false })
			})
		}
	});

	Server.get("/logout", (req, res) => {
		if(!req.session.profile){
			return res.redirect("/");
		} else {
			req.session.destroy();
			res.redirect('/');
		}
	});

	Server.get("/loginfail", (req, res) => {
		page(req, res, "loginfail");
	});
}