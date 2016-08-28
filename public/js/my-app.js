// Initialize your app
var myApp = new Framework7({
    material: true,
    cache: true,
    fastClicks: true,
    PushState: true,
    onAjaxStart: function (xhr) {
        myApp.showIndicator();
    },
    onAjaxComplete: function (xhr) {
        myApp.hideIndicator();
    }
});

// Export selectors engine
var $$ = Dom7;

// Add view
var mainView = myApp.addView('.view-main', {
    dynamicNavbar: true
});

var rightView = myApp.addView('.view-right', {});

$$('.panel-right').on('open', function () {
    $$('.statusbar-overlay').addClass('with-panel-right');
});
$$('.panel-right').on('close', function () {
    $$('.statusbar-overlay').removeClass('with-panel-right');
});

$$('.page-content').on('scroll', function () {
    if ($$(this).scrollTop() > 80) {
        $$('#main-navbar').removeClass("main-navbar");
        $$('#main-navbar').addClass("main-navbar-show");
    }
    else {
        $$('#main-navbar').removeClass("main-navbar-show");
        $$('#main-navbar').addClass("main-navbar");
    }
});

$$('#tab-2').on('show', function () {
    myApp.updateCarshopData();
});

myApp.updateCarshopData = function (callback) {
    var q = '/api/?getItems';
    if (!navigator.onLine) {
        myApp.alert('You need internet connection to update carshop data');
    }
    myApp.showPreloader('Загрузка...');
    $$.get(q, function (data) {
        myApp.hidePreloader();
        data = JSON.parse(data);
        var carItems = [];
        var carList;
        var broken;
        for (var i = 0; i < 52; i++) {
            broken = data[i].broken == 'Битый' ? '<span style="color:red;">data[i].broken</span>' : data[i].broken;
            carItems[i] = '<div class="col-100 tablet-50"><div class="card carshop-card carshop-card-header-pic"><label class="price">' + data[i].price + '</label><div style="background-image:url(' + data[i].photos + ')" valign="bottom" class="card-header color-white">' + data[i].title + ', ' + data[i].year + '</div><div class="card-content"><div class="card-content-inner"><p>' + broken + ', ' + data[i].mileage + ', ' + data[i].engine + ', ' + data[i].body + ', ' + data[i].drive + ', ' + data[i].fuel + '</p></div></div> <div class="card-footer"><a href="messages.html" data-call="' + data[i].id + '" id="call" class="link">Позвонить</a></div></div></div>';
        }
        carList = carItems.join('');
        $$('#carshop').html(carList);
        if (callback) callback();
    });
};

myApp.onPageInit('messages', function (page) {
    /*

    var messages = function (text) {
        var myMessages = myApp.messages('.messages');
        $$('#send').on('click', function (e) {
            myMessages.addMessage({
                text: 'rtyui',
                type: 'sent',
                avatar: 'http://lorempixel.com/output/people-q-c-200-200-6.jpg',
                date: 'Только что'
            });

        });
    };
*/


    var dataset = $$.dataset('#call');
    var actionSheetButtons;
    if (dataset !== undefined) {
        actionSheetButtons = [
            [
                {
                    text: 'Приветствие',
                    onClick: function () {
                        var hello = ["Добрый день", "Здравструйте", "Привет"];
                        var i = Math.floor(Math.random() * hello.length);
                        $$('#message').html(hello[i]);
                    }
                },
                {
                    text: 'Задать вопрос',
                    color: 'blue',
                    onClick: function () {
                        myApp.alert('Second Alert!');
                    }
                },
                {
                    text: 'Торг',
                    color: 'deeporange',
                    onClick: function () {
                        myApp.alert('You have clicked red button!');
                    }
                },
                {
                    text: 'Договориться о встречи',
                    color: 'green',
                    onClick: function () {
                        myApp.alert('You have clicked red button!');
                    }
                },
                {
                    text: 'Попрощаться',
                    onClick: function () {
                        var goodbye = ["До свидания", "Счастливо", "Пока"];
                        var i = Math.floor(Math.random() * goodbye.length);
                        $$('#message').html(goodbye[i]);
                    }
                }
            ],
            [
                {
                    text: 'Отмена'
                }
            ]
        ];
    } else {
        actionSheetButtons = [
            [
                {
                    text: 'Приветствие',
                    onClick: function () {
                        var hello = ["Добрый день", "Здравструйте", "Привет"];
                        var i = Math.floor(Math.random() * hello.length);
                        $$('#message').val(hello[i]);
                    }
                },
                {
                    text: 'Положительный ответ',
                    color: 'green',
                    onClick: function () {
                        myApp.alert('Second Alert!');
                    }
                },
                {
                    text: 'Лживый ответ',
                    color: 'deeporange',
                    onClick: function () {
                        myApp.alert('You have clicked red button!');
                    }
                },
                {
                    text: 'Отрицательный ответ',
                    color: 'red',
                    onClick: function () {
                        myApp.alert('You have clicked red button!');
                    }
                },
                {
                    text: 'Попрощаться',
                    onClick: function () {
                        var goodbye = ["До свидания", "Счастливо", "Пока"];
                        var i = Math.floor(Math.random() * goodbye.length);
                        $$('#message').val(goodbye[i]);
                    }
                }
            ],
            [
                {
                    text: 'Отмена'
                }
            ]
        ];
    }
    $$('#message').on('click', function (e) {
        this.style.color = '#333';
        myApp.actions(this, actionSheetButtons);
    });

    var conversationStarted = false;
    var answers = [
        'Yes!'
    ];
    var people = [
        {
            name: 'Продавец',
            avatar: '/public/img/foto.png'
        }

    ];
    var answerTimeout, isFocused;

    // Initialize Messages
    var myMessages = myApp.messages('.messages');

    // Initialize Messagebar
    console.log(myApp.messagebar('.messagebar'));
    var myMessagebar = myApp.messagebar('.messagebar');

    $$('.messagebar a.send-message').on('touchstart mousedown', function () {
        isFocused = document.activeElement && document.activeElement === myMessagebar.textarea[0];
    });
    $$('.messagebar a.send-message').on('click', function (e) {
        // Keep focused messagebar's textarea if it was in focus before
        if (isFocused) {
            e.preventDefault();
            myMessagebar.textarea[0].focus();
        }
        var messageText = myMessagebar.value();
        if (messageText.length === 0) {
            return;
        }
        // Clear messagebar
        myMessagebar.clear();

        // Add Message
        myMessages.addMessage({
            text: messageText,
            type: 'sent',
            date: 'Только что'
        });
        conversationStarted = true;
        // Add answer after timeout
        if (answerTimeout) clearTimeout(answerTimeout);
        answerTimeout = setTimeout(function () {
            var answerText = answers[Math.floor(Math.random() * answers.length)];
            var person = people[Math.floor(Math.random() * people.length)];
            myMessages.addMessage({
                text: answerText,
                type: 'received',
                name: person.name,
                avatar: person.avatar,
                date: 'Только что'
            });
        }, 2000);
    });

});