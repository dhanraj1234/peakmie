/**
 * Migration to create Userspostsreports table.
 */

var config = require(__dirname + '/../config/config.json')

module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.createTable('userspostsreports', {
    reportid: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER,
    },
    postid: {
      type: Sequelize.INTEGER,
    },
    userid: {
      type: Sequelize.INTEGER,
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
    await queryInterface.dropTable('userspostsreports', { transaction });
  }),
};
