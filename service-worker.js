  var YAHOO_WEATHER_API_ENDPOINT = 'https://query.yahooapis.com/' +
  'v1/public/yql?q=select%20*%20from%20weather.forecast%20where%' +
  '20woeid%20in%20(select%20woeid%20from%20geo.places(1)%20where' +
  '%20text%3D%22london%2C%20uk%22)&format=json&env=store%3A%2F%2' +
  'Fdatatables.org%2Falltableswithkeys';

  self.addEventListener('push', function(event) {  
  // Since there is no payload data with the first version  
  // of push messages, we'll grab some data from  
  // an API and use it to populate a notification  
  event.waitUntil(  
    fetch(YAHOO_WEATHER_API_ENDPOINT).then(function(response) {  
      if (response.status !== 200) {  
        // Either show a message to the user explaining the error  
        // or enter a generic message and handle the   
        // onnotificationclick event to direct the user to a web page  
        console.log('Looks like there was a problem. Status Code: ' + response.status);  
      throw new Error();  
      }

      // Examine the text in the response  
      return response.json().then(function(data) {  
        if (data.error || !data.notification) {  
          console.error('The API returned an error.', data.error);  
          throw new Error();  
        }  
          
        var title = data.notification.title;  
        var message = data.notification.message;  
        var icon = data.notification.icon;  
        var notificationTag = data.notification.tag;

        return self.registration.showNotification(title, {  
          body: message,  
          icon: icon,  
          tag: notificationTag  
        });  
      });  
    }).catch(function(err) {  
      console.error('Unable to retrieve data', err);

      var title = 'An error occurred';
      var message = 'We were unable to get the information for this push message';  
      var icon = URL_TO_DEFAULT_ICON;  
      var notificationTag = 'notification-error';  
      return self.registration.showNotification(title, {  
          body: message,  
          icon: icon,  
          tag: notificationTag  
        });  
    })  
  );  
});


 self.addEventListener('notificationclick', function(event) {  
  console.log('On notification click: ', event.notification.tag);  
  // Android doesn't close the notification when you click on it  
  // See: http://crbug.com/463146  
  event.notification.close();

  // This looks to see if the current window is already open and  
  // focuses if it is  
  event.waitUntil(
    clients.matchAll({  
      type: "window"  
    })
    .then(function(clientList) {  
      for (var i = 0; i < clientList.length; i++) {  
        var client = clientList[i];  
        if (client.url == '/' && 'focus' in client)  
          return client.focus();  
      }  
      if (clients.openWindow) {
        return clients.openWindow('/');  
      }
    })
  );
});






