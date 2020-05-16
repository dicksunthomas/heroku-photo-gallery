require('dotenv').config({silent: true});

module.exports = {
    DXB_API_DOMAIN: 'https://api.dropboxapi.com',
    DXB_OAUTH_DOMAIN: 'https://www.dropbox.com',
    DXB_OAUTH_PATH: '/oauth2/authorize',
    DXB_TOKEN_PATH: '/oauth2/token',
    DXB_APP_KEY: process.env.DXB_APP_KEY,
    DXB_APP_SECRET: process.env.DXB_APP_SECRET,
    OAUTH_REDIRECT_URL: process.env.OAUTH_REDIRECT_URL,
    DBX_LIST_FOLDER_PATH:'/2/files/list_folder',
    DBX_LIST_FOLDER_CONTINUE_PATH:'/2/files/list_folder/continue',
    DBX_GET_TEMPORARY_LINK_PATH:'/2/files/get_temporary_link',
    SESSION_ID_SECRET: process.env.SESSION_ID_SECRET
}