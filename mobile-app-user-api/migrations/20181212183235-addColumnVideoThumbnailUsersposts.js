/**
 * Migration to create FriendsChat table.
 */

var config = require(__dirname + '/../config/config.json')

module.exports = {
    up: (queryInterface, Sequelize) => queryInterface.addColumn(
        'usersposts',
        'videothumbnail',
        Sequelize.STRING
    )
};
