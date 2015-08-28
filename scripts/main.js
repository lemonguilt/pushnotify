/*!
 *
 *  Web Starter Kit
 *  Copyright 2014 Google Inc. All rights reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *    https://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License
 *
 */
(function () {
  'use strict';

  var querySelector = document.querySelector.bind(document);

  var navdrawerContainer = querySelector('.navdrawer-container');
  var body = document.body;
  var appbarElement = querySelector('.app-bar');
  var menuBtn = querySelector('.menu');
  var main = querySelector('main');

  function closeMenu() {
    body.classList.remove('open');
    appbarElement.classList.remove('open');
    navdrawerContainer.classList.remove('open');
  }

  function toggleMenu() {
    body.classList.toggle('open');
    appbarElement.classList.toggle('open');
    navdrawerContainer.classList.toggle('open');
    navdrawerContainer.classList.add('opened');
  }

  main.addEventListener('click', closeMenu);
  menuBtn.addEventListener('click', toggleMenu);
  navdrawerContainer.addEventListener('click', function (event) {
    if (event.target.nodeName === 'A' || event.target.nodeName === 'LI') {
      closeMenu();
    }
  });

  var isPushEnabled = false;


  window.addEventListener('load', function() {  
    var pushButton = document.querySelector('.js-push-button');  
    pushButton.addEventListener('click', function() {  
      if (isPushEnabled) {  
        unsubscribe();  
      } else {  
        subscribe();  
      }  
    });

    // Check that service workers are supported, if so, progressively  
    // enhance and add push messaging support, otherwise continue without it.  
    if ('serviceWorker' in navigator) {  
      navigator.serviceWorker.register('service-worker.js')  
      .then(initialiseState);  
    } else {  
      console.warn('Service workers aren\'t supported in this browser.');  
    }  
  });





  // Once the service worker is registered set the initial state  
  function initialiseState() {  
    // Are Notifications supported in the service worker?  
    if (!('showNotification' in ServiceWorkerRegistration.prototype)) {  
      console.warn('Notifications aren\'t supported.');  
      return;  
    }

    // Check the current Notification permission.  
    // If its denied, it's a permanent block until the  
    // user changes the permission  
    if (Notification.permission === 'denied') {  
      console.warn('The user has blocked notifications.');  
      return;  
    }

    // Check if push messaging is supported  
    if (!('PushManager' in window)) {  
      console.warn('Push messaging isn\'t supported.');  
      return;  
    }

    // We need the service worker registration to check for a subscription  
    navigator.serviceWorker.ready.then(function(serviceWorkerRegistration) {  
      // Do we already have a push message subscription?  
      serviceWorkerRegistration.pushManager.getSubscription()  
        .then(function(subscription) {  
          // Enable any UI which subscribes / unsubscribes from  
          // push messages.  
          var pushButton = document.querySelector('.js-push-button');  
          pushButton.disabled = false;

          if (!subscription) {  
            // We aren't subscribed to push, so set UI  
            // to allow the user to enable push  
            return;  
          }
          
          // Keep your server in sync with the latest subscriptionId
          console.log(subscription);
          //sendSubscriptionToServer(subscription);

          // Set your UI to show they have subscribed for  
          // push messages  
          pushButton.textContent = 'Disable Push Messages';  
          isPushEnabled = true;  
        })  
        .catch(function(err) {  
          console.warn('Error during getSubscription()', err);  
        });  
    });  
  }



  function subscribe() {
    // Disable the button so it can't be changed while
    // we process the permission request
    var pushButton = document.querySelector('.js-push-button');
    pushButton.disabled = true;

    navigator.serviceWorker.ready.then(function(serviceWorkerRegistration) {
      serviceWorkerRegistration.pushManager.subscribe({userVisibleOnly: true})
        .then(function(subscription) {
          // The subscription was successful
          isPushEnabled = true;
          pushButton.textContent = 'Disable Push Messages';
          pushButton.disabled = false;

          // TODO: Send the subscription subscription.endpoint
          // to your server and save it to send a push message
          // at a later date
          //return sendSubscriptionToServer(subscription);
          console.log(subscription);
        })
        .catch(function(e) {
          if (Notification.permission === 'denied') {
            // The user denied the notification permission which
            // means we failed to subscribe and the user will need
            // to manually change the notification permission to
            // subscribe to push messages
            console.log('Permission for Notifications was denied');
            pushButton.disabled = true;
          } else {
            // A problem occurred with the subscription, this can
            // often be down to an issue or lack of the gcm_sender_id
            // and / or gcm_user_visible_only
            console.log('Unable to subscribe to push.', e);
            pushButton.disabled = false;
            pushButton.textContent = 'Enable Push Messages';
          }
        });
    });
  }

  function unsubscribe() {  
    var pushButton = document.querySelector('.js-push-button');  
    pushButton.disabled = true;

    navigator.serviceWorker.ready.then(function(serviceWorkerRegistration) {  
      // To unsubscribe from push messaging, you need get the  
      // subscription object, which you can call unsubscribe() on.  
      serviceWorkerRegistration.pushManager.getSubscription().then(  
        function(pushSubscription) {  
          // Check we have a subscription to unsubscribe  
          if (!pushSubscription) {  
            // No subscription object, so set the state  
            // to allow the user to subscribe to push  
            isPushEnabled = false;  
            pushButton.disabled = false;  
            pushButton.textContent = 'Enable Push Messages';  
            return;  
          }  

          // TODO: Make a request to your server to remove
          // the users data from your data store so you
          // don't attempt to send them push messages anymore

          // We have a subscription, so call unsubscribe on it  
          pushSubscription.unsubscribe().then(function(successful) {  
            pushButton.disabled = false;  
            pushButton.textContent = 'Enable Push Messages';  
            isPushEnabled = false;  
          }).catch(function(e) {  
            // We failed to unsubscribe, this can lead to  
            // an unusual state, so may be best to remove   
            // the users data from your data store and   
            // inform the user that you have done so

            console.log('Unsubscription error: ', e);  
            pushButton.disabled = false;
            pushButton.textContent = 'Enable Push Messages'; 
          });  
        }).catch(function(e) {  
          console.error('Error thrown while unsubscribing from push messaging.', e);  
        });  
    });  
  }

  // This method handles the removal of subscriptionId
  // in Chrome 44 by concatenating the subscription Id
  // to the subscription endpoint
  function endpointWorkaround(pushSubscription) {
    // Make sure we only mess with GCM
    if (pushSubscription.endpoint.indexOf('https://android.googleapis.com/gcm/send') !== 0) {
      return pushSubscription.endpoint;
    }

    var mergedEndpoint = pushSubscription.endpoint;
    // Chrome 42 + 43 will not have the subscriptionId attached
    // to the endpoint.
    if (pushSubscription.subscriptionId &&
      pushSubscription.endpoint.indexOf(pushSubscription.subscriptionId) === -1) {
      // Handle version 42 where you have separate subId and Endpoint
      mergedEndpoint = pushSubscription.endpoint + '/' +
        pushSubscription.subscriptionId;
    }
    return mergedEndpoint;
  }

  function onPushSubscription(e) {
    console.log("pushSubscription = ", e.endpoint), window.PushDemo.ui.showGCMPushOptions(!0), window.PushDemo.ui.setPushSwitchDisabled(!1), console.log("pushSubscription: ", e);
    var s = document.querySelector(".js-xhr-button");
    s.addEventListener("click", function(s) {
        var t = new FormData,
            i = e.endpoint;
        "subscriptionId" in e && (i.includes(e.subscriptionId) || (i += "/" + e.subscriptionId)), t.append("endpoint", i), fetch(PUSH_SERVER_URL + "/send_push", {
            method: "post",
            body: t
        }).then(function(e) {
            console.log("Response = ", e)
        })["catch"](function(e) {
            console.log("Fetch Error :-S", e)
        })
    });
    var t = e.endpoint,
        i = "curl -I -X POST " + e.endpoint;
    if (0 === t.indexOf("https://android.googleapis.com/gcm/send")) {
        t = "https://android.googleapis.com/gcm/send";
        var n = null;
        if (e.subscriptionId) n = e.subscriptionId;
        else {
            var a = e.endpoint.split("/");
            n = a[a.length - 1]
        }
        i = 'curl --header "Authorization: key=' + API_KEY + '" --header Content-Type:"application/json" ' + t + ' -d "{\\"registration_ids\\":[\\"' + n + '\\"]}"'
    }
    var o = document.querySelector(".js-curl-code");
    o.innerHTML = i
}






})();




