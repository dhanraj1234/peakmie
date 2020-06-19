/**
 * Migration to create admin table.
 */

var config = require(__dirname + '/../config/config.json');

module.exports = {
    up: (queryInterface, Sequelize) => queryInterface.createTable('tbladmin', {
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
        adminrole: {
            defaultValue: 'Super',
            type: Sequelize.STRING,
        },
        password: {
            type: Sequelize.STRING,
        },
        username: {
            unique: true,
            type: Sequelize.STRING,
        },
        gender: {
            type: Sequelize.STRING,
        },
        userprofilepictureurl: {
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
        await queryInterface.dropTable('tbladmin', { transaction });
    }),
};
