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


(function(){
	$(document).ready(function(){
		function states () {
			var my = this;
			this.states = [];
			this.set = function(v, i) {
				i === 0 || i ? my.states[i] = v : my.states.push(v)
				return my
			}
			this.rev = function(i) {
				this.states[i] = !my.states[i]
				return my
			}
			this.all = function() {
				return !my.states.includes(false)
			}
			this.get = function(i) {
				return my.states[i]
			}
		}

		const inputs = {
			email: $("#uEmail"),
				emailCheck: $("#emailCheck"),
			id: $("#uID"),
				idCheck: $("#idCheck"),
			pw: $("#uPW"),
				repw: $("#urePW"),
			nick: $("#uNick"),
				nickCheck: $("#nickCheck"),
			submit: $("#register")
		}

		const defs = {
			email: "이메일은 아이디 · 비밀번호 찾기에 사용됩니다.",
			id: "로그인에 사용될 아이디입니다.",
			pw: "로그인에 사용될 비밀번호입니다.",
			nick: "게임 내부에서 사용될 닉네임 입니다."
		}

		const flags = {
			email: 0,
			id: 1,
			pw: 2,
			nick: 3
		}

		const state = new states()
		Object.keys(flags).forEach(function() {
			state.set(false)
		})
	
		const desc = {
			email: $("#email"),
			id: $("#id"),
			pw: $("#password"),
			nick: $("#nickname")
		}

		function pwCR() {
			if (inputs.pw.val() !== inputs.repw.val()) {
				desc.pw.html('<font color="red">비밀번호가 일치하지 않습니다.</font>');
				state.set(false, flags.pw);
			} else {
				desc.pw.html('<font color="green">비밀번호가 일치합니다.</font>');
				state.set(true, flags.pw);
			}
		}

		function detecChange(k) {
			return function() {
				if (state.get(flags[k])) {
					state.rev(flags[k]);
					desc[k].html(defs[k]);
				}
			}
		}

		inputs.pw.keyup(pwCR);
		inputs.repw.keyup(pwCR);
		inputs.email.keyup(detecChange('email'));
		inputs.id.keyup(detecChange('id'));
		inputs.nick.keyup(detecChange('nick'));

		inputs.emailCheck.on('click', function() {
			$.post('/getDupl', { email: inputs.email.val() }, function(res) {
				if (res.err) return console.log(res.err);
				if (res.exist) {
					state.set(false, flags.email);
					return desc.email.html('<font color="red">사용 할 수 없는 이메일 입니다.</font>');
				} else {
					state.set(true, flags.email);
					return desc.email.html('<font color="green">사용 가능한 이메일 입니다.</font>');
				}
			});
		});

		inputs.idCheck.on('click', function() {
			$.post('/getDupl', { id: inputs.id.val() }, function(res) {
				if (res.err) return console.log(res.err);
				if (res.exist) {
					state.set(false, flags.id);
					return desc.id.html('<font color="red">사용 할 수 없는 아이디 입니다.</font>');
				} else {
					state.set(true, flags.id);
					return desc.id.html('<font color="green">사용 가능한 아이디 입니다.</font>');
				}
			});
		});

		inputs.nickCheck.on('click', function() {
			$.post('/getDupl', { nick: inputs.nick.val() }, function(res) {
				if (res.err) return console.log(res.err);
				if (res.exist) {
					state.set(false, flags.nick);
					return desc.nick.html('<font color="red">사용 할 수 없는 닉네임 입니다.</font>');
				} else {
					state.set(true, flags.nick);
					return desc.nick.html('<font color="green">사용 가능한 닉네임 입니다.</font>');
				}
			});
		});

		inputs.submit.on('click', function() {
			if (!state.all()) return
			$.post('/register', {
				email: inputs.email.val(),
				id: inputs.id.val(),
				pw: inputs.pw.val(),
				nick: inputs.nick.val()
			}, function(res) {
				if (res.err) return console.log(res.err);
				else {
					alert('이메일을 확인해 주세요.');
					window.location = '/login';
				}
			});
		});
	});
})();