const config = require('../../sub/auth.json');

module.exports.config = {
    strategy: require('passport-local').Strategy,
    color: '#7CC4F8',
    fontColor: '#000000',
    vendor: 'local',
    displayName: 'withLocal'
}

module.exports.strategyConfig = {
    usernameField : config.local.usernameField,
    passwordField : config.local.passwordField,
    callbackURL: config.local.callbackURL,
    passReqToCallback: true,
    failWithError: true
}

module.exports.strategy = (process, MainDB, Ajae) => {
    return (req, id, pw, done) => {
        MainDB.users.findOne([ '_id', id ], [ 'password', pw ]).on(profile => {
            const $p = {};

            $p.authType = 'local';
            $p.id = profile._id;
            $p.title = $p.name = profile._id;
            $p.verifyed = profile.kkutu.verifyed;
            $p.eToken = profile.kkutu.eToken;
            $p.email = profile.kkutu.email;
            //$p.image = profile.kkutu.image; //comming soon

            process(req, 'local', MainDB, $p, done);
        })
    }
}