const
crypto = require('crypto'),
config = require('./config'),
rp =  require('request-promise'),
NodeCache = require('node-cache');
var mycache = new NodeCache();


async function getLinkAsync(token){
    let result = await listImagePathsAsync(token, '');
    let temporaryLinkResults = await getTemporaryLinksForPathsAsync(token, result.paths);
    var temporaryLinks = temporaryLinkResults.map(function (entry){
        return entry.link;
    })
    return temporaryLinks;
}

async function listImagePathsAsync(token, path){
    let options={
        url: config.DXB_API_DOMAIN + config.DBX_LIST_FOLDER_PATH,
        headers: {"Authorization":"Bearer "+token},
        method: 'POST',
        json: true,
        body: {"path": path}
    }
    try{
        let result= await rp(options);
        //filter response to images only
        let entriesFiltered=result.entries.filter(function(entry){
            return entry.path_lower.search(/\.(gif|jpg|jpeg|tiff|png)$/i) > -1;
        });
        var paths = entriesFiltered.map(function(entry){
            return entry.path_lower;
        });
        let response = {};
        response.paths = paths;
        if(result.hasmore) response.cursor= result.cursor;
        return response;
    }catch(error){
        return next(new Error('error listing folder. ' + error.message));
    }
}
function getTemporaryLinksForPathsAsync(token, paths){
    var promises = [];
    let options = {
        url: config.DXB_API_DOMAIN + config.DBX_GET_TEMPORARY_LINK_PATH,
        headers: {"Authorization":"Bearer " + token},
        method: 'POST',
        json: true
    }
    paths.forEach((path_lower) =>{
        options.body = {"path":path_lower};
        promises.push(rp(options));
    });
    return Promise.all(promises);
}

function regenerateSessionAsync(req){
    return new Promise((resolve,reject) => {
        req.session.regenerate((err) => {
            err ? reject(err) : resolve();
        });
    });
}

module.exports.home = async (req, res, next) => {
    let token = req.session.token;
    if(token){
        try{
        let paths = await getLinkAsync(token);
        res.render('gallery', { imgs: paths, layout:false });
        }catch(err){
            return next(new Error("Error while getting images from Dropbox"));
        }
    }else{
        res.redirect('/login');
    }
};

module.exports.login = (req, res, next) => {
    //creating a random state value
    let state = crypto.randomBytes(16).toString('hex');

    //save state and temporary session for 10 mins
    mycache.set(state, req.sessionID, 600);

    let dbxRedirect = config.DXB_OAUTH_DOMAIN 
                    + config.DXB_OAUTH_PATH 
                    + "?response_type=code&client_id="
                    + config.DXB_APP_KEY 
                    + "&redirect_uri="+ config.OAUTH_REDIRECT_URL 
                    + "&state=" + state;
    res.redirect(dbxRedirect);
}

module.exports.oauthredirect = async (req, res, next) => {
    if(req.query.error_description){
        return next ( new Error(req.query.error_description));
    }

    let state = req.query.state;
    if(mycache.get(state)!=req.sessionID){
        return next( new Error("session expired or invalid state"));
    }

    //exchanging code for token
    if(req.query.code){
        let options={
            url: config.DXB_API_DOMAIN + config.DXB_TOKEN_PATH,
            qs: {
                'code': req.query.code,
                'grant_type': 'authorization_code',
                'client_id': config.DXB_APP_KEY,
                'client_secret': config.DXB_APP_SECRET,
                'redirect_uri': config.OAUTH_REDIRECT_URL
            },
            method: 'POST',
            json: true
        }
        try{
            let response = await rp(options);
            await regenerateSessionAsync(req);
            req.session.token = response.access_token;
            res.redirect('/');
        }catch(err){
            return next(new Error("Error occured while getting the token: ", err.message));
        }
    }
}