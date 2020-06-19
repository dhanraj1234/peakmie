/**
 * Migration to create UsersPosts table.
 */

var config = require(__dirname + '/../config/config.json')

module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.createTable('usersposts', {
    postid: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER,
    },
    userid: {
      type: Sequelize.INTEGER,
    },
    parentid: {
      type: Sequelize.INTEGER,
    },
    postsharewith: {
      type: Sequelize.INTEGER,
    },
    postviewcount: {
      defaultValue: 0,
      type: Sequelize.INTEGER,
    },
    url: {
      type: Sequelize.STRING,
    },
    postexpired: {
      defaultValue: false,
      type: Sequelize.BOOLEAN,
    },
    postexpiredat: {
      type: Sequelize.DATE,
    },
    gender: {
      type: Sequelize.STRING,
    },
    type: {
      type: Sequelize.STRING,
    },
    maxvisitcount: {
      type: Sequelize.INTEGER,
    },
    visibilitytime: {
      type: Sequelize.STRING,
    },
    ratingtype: {
      type: Sequelize.STRING,
    },
    postshareby: {
      type: Sequelize.INTEGER,
    },
    sharedpostcaptionvalue: {
      type: Sequelize.INTEGER,
    },
    postsharedat: {
      type: Sequelize.DATE,
    },
    isreported: {
      defaultValue: false,
      type: Sequelize.BOOLEAN,
    },
    reporteduserid: {
      type: Sequelize.INTEGER,
    },
    reportedat:{
      type: Sequelize.DATE,
    },
    createdat: {
      defaultValue: Sequelize.fn('NOW'),
      type: Sequelize.DATE,
    },
    updatedat: {
      type: Sequelize.DATE,
    },
    deletedat: {
      defaultValue: null,
      type: Sequelize.DATE,
    },
  }),
  down: (queryInterface, Sequelize) => queryInterface.sequelize.transaction(async (transaction) => {
    await queryInterface.dropTable('usersposts', { transaction });

  }),
};
