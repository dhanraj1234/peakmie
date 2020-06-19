/**
 * Migration to create FriendsChat table.
 */

var config = require(__dirname + '/../config/config.json')

module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.createTable('friendschat', {
    chatid: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER,
    },
    msgbyid: {
      type: Sequelize.INTEGER,
    },
    msgtoid: {
      type: Sequelize.INTEGER,
    },
    msgvalue: {
      type: Sequelize.STRING,
    },
    url: {
      type: Sequelize.STRING,
    },
    type: {
      type: Sequelize.STRING,
    },
    isseen: {
      defaultValue: false,
      type: Sequelize.BOOLEAN,
    },
    createdat: {
      type: Sequelize.DATE,
    },
    deletedat: {
      defaultValue: null,
      type: Sequelize.DATE,
    },
  }),
  down: (queryInterface, Sequelize) => queryInterface.sequelize.transaction(async (transaction) => {
    await queryInterface.dropTable('friendschat', { transaction });

  }),
};
