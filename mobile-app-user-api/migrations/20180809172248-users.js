/**
 * Migration to create Users table.
 */

var config = require(__dirname + '/../config/config.json');

module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.createTable('users', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER,
    },
    name: {
      type: Sequelize.STRING,
    },
    email: {
      type: Sequelize.STRING,
    },
    country: {
      type: Sequelize.STRING,
    },
    password: {
      type: Sequelize.STRING,
    },
    username: {
      unique: true,
      type: Sequelize.STRING,
    },
    visibility: {
      allowNull: false,
      type: Sequelize.ENUM('online', 'offline'),
    },
    isblocked: {
      defaultValue: false,
      type: Sequelize.BOOLEAN,
    },
    blockedtype: {
      type: Sequelize.STRING,  
    },
    blockedat: {
      type: Sequelize.DATE,
    },
    gender: {
      type: Sequelize.STRING,
    },
    userprofilepictureurl: {
      type: Sequelize.STRING,
    },
    platform: {
      type: Sequelize.ENUM('ios', 'android'),
    },
    devicetoken: {
      type: Sequelize.STRING,
    },
    createdat: {
      defaultValue: Sequelize.fn('NOW'),
      type: Sequelize.DATE,
    },
    updatedt: {
      type: Sequelize.DATE,
    },
    deletedat: {
      defaultValue: null,
      type: Sequelize.DATE,
    },
  }),
  down: (queryInterface, Sequelize) => queryInterface.sequelize.transaction(async (transaction) => {
    await queryInterface.dropTable('users', { transaction });
  }),
};
