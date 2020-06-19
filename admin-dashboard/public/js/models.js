var app = angular.module('peakmie', ['mgcrea.ngStrap', 'toaster', 'ngclipboard','ngSanitize']);

app.run(function($rootScope) {
    $rootScope.$on("emitBroadcast", function(event, args) {
        $rootScope.$broadcast(args.handle, args);
    });
});

app.directive('ngConfirmClick', [function(){
    return {
        link: function (scope, element, attr) {
            var msg = attr.ngConfirmClick || "Are you sure?";
            var clickAction = attr.confirmedClick;
            element.bind('click',function (event) {
                if ( window.confirm(msg) ) {
                    scope.$eval(clickAction)
                }
            });
        }
    };
}])


function User() {
    var user = {
        id: '',
        createdat: '',
        email: '',
        // emailotp: '',
        username: '',
        name: '',
        gender: '',
        isblocked: '',
        userblocked: '',
        reporteduserid: '',
        caption: '',
        reportedat: '',
        userid: '',
    };
    return user;
};

function createUser(data) {
    var user = User();
    fillUser(user, data);
    return user;
};

function fillUser(user, data) {
    user.id = data.id;
    user.createdat = data.createdat;
    user.email = data.email;
    user.username = data.username;
    user.name = data.name;
    user.gender = data.gender;
    user.isblocked = data.isblocked;
    user.userblocked = data.userblocked;
    user.caption = data.caption;
    user.reportedat = data.reportedat;
    user.reporteduserid = data.reporteduserid;
    user.userid = data.userid;

};

