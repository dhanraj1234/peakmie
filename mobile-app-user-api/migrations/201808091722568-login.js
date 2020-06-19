/**
 * Migration to create logindetails table.
 */

var config = require(__dirname + '/../config/config.json');

module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.createTable('logindetails', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER,
    },
    userid: {
      allowNull: false,
      type: Sequelize.INTEGER,
    },
    email: {
      type: Sequelize.STRING,
    },
    platform: {
        type: Sequelize.STRING,
    },
    devicetoken: {
      type: Sequelize.STRING,
    },
    loginby: {
      type: Sequelize.STRING,
    },
    status: {
      defaultValue: 'offline',
      type: Sequelize.STRING,
    },
    lastloginat: {
      type: Sequelize.DATE,
    },
    createdat: {
      allowNull: false,
      defaultValue: Sequelize.fn('NOW'),
      type: Sequelize.DATE,
    },
    updatedat: {
      type: Sequelize.DATE,
    },
    deletedat: {
      type: Sequelize.DATE,
    },
    loggedoutat: {
        type: Sequelize.DATE,
    },
  }),
  down: (queryInterface, Sequelize) => queryInterface.sequelize.transaction(async (transaction) => {
    await queryInterface.dropTable('logindetails', { transaction });
  }),
};