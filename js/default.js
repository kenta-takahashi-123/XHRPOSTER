(function () {
  require([
    "dijit/Dialog",
    "dijit/form/Form",
    "dijit/form/Button",
    "dijit/form/TextBox",
    "dijit/form/CheckBox",
    "dijit/form/ValidationTextBox",
    "dijit/form/SimpleTextarea",
    "dijit/form/NumberSpinner",
    "dijit/form/ComboBox"
  ]);

  require([
    "dojo/parser",
    "dijit/TitlePane",
    "dijit/Tooltip",
    "dijit/layout/TabContainer",
    "dijit/layout/BorderContainer",
    "dijit/layout/ContentPane"
  ], function (parser, titlePane, tooltip, tab, border, pane) {
    dojo.ready(function () {
      parser.parse(dojo.body());

      /**
       * counter of request tab
       * @type {Number}
       */
      var count = 1;

      /**
       * Response tab container.
       * @type {dijit.layout.TabContainer}
       */
      var tabContainer = dijit.byId("tab_response");

      /**
       * Form for common parameters
       * @type {dijit.form.Form}
       */
      var formCommon = dijit.byId("formCommon");

      /**
       * Form for HTTP headers
       * @type {dijit.form.Form}
       */
      var formHeaders = dijit.byId("formHeaders");

      /**
       * @type {dijit.form.SimpleTextarea}
       */
      var formOtherHeaders = dijit.byId('otherHeaders');

      /**
       * Form for HTTP headers
       * @type {dijit.form.Form}
       */
      var formBody = dijit.byId("formBody");

      /**
       * method for sending XHR
       * @param {String} method
       */
      var send = function (/* string */ method) {
        var tab = createTab();
        var loadingPane = new pane({
          region:"center",
          content:dojo.create('div', {innerHTML:'Loading...'})
        });
        tab.addChild(loadingPane);

        var requestObject = generateRequestObject();

        var callback = function (response, ioArgs) {
          var containers = createResponsePane(method, response, ioArgs, generateRequestObject());
          tab.removeChild(loadingPane);
          tab.addChild(containers.center);
          tab.addChild(containers.bottom);
        };
        requestObject.load = callback;
        requestObject.error = callback;

        dojo.xhr(method, requestObject);
      };

      var createTab = function () {
        //Tab Pane
        var container = new border({
          closable:true,
          title:"#" + count,
          gutters:false,
          liveSplitters:true
        });
        count++;
        tabContainer.addChild(container);
        tabContainer.selectChild(container);
        container.startup();
        return container;
      };

      var createResponsePane = function (method, response, ioArgs, formData) {
        //Method, Status, Bottom
        var containerCenter = new border({
          region:"center",
          gutters:false
        });

        var containerBottom = new dijit.layout.BorderContainer({
          region:"bottom",
          gutters:false,
          splitter:true,
          closable:true,
          style:(formData.openHeader[0] || formData.openRequest[0]) ? "height:150px;" : "height:80px;"
        });

        //Method, Status
        var containerCenterTop = new dijit.layout.ContentPane({region:"top"});
        containerCenter.addChild(containerCenterTop);

        //Body
        var containerCenterCenter = new dijit.layout.TabContainer({
          region:"center",
          tabPosition:"bottom",
          style:"margin: 5px;"
        });
        containerCenter.addChild(containerCenterCenter);

        //Header, Request
        var containerBottomCenter = new dijit.layout.ContentPane({region:"center"});
        containerBottom.addChild(containerBottomCenter);

        if (!ioArgs.args.url) {
          ioArgs.args.url = '(blank)';
        }
        var title = dojo.create("div", {innerHTML:escapeHTML(method + " on " + ioArgs.args.url)});
        dojo.place(title, containerCenterTop.domNode);
        var status = dojo.create("div", {innerHTML:escapeHTML("Status: " + ioArgs.xhr.status + " " + ioArgs.xhr.statusText)});
        dojo.place(status, containerCenterTop.domNode);

        var bodyRaw = new dijit.layout.ContentPane({title:"Raw data"});
        var bodyRawText = new dijit.form.SimpleTextarea({
          value:ioArgs.xhr.responseText,
          style:"width:97%;height:97%;"
        });
        dojo.place(bodyRawText.domNode, bodyRaw.domNode);
        containerCenterCenter.addChild(bodyRaw);

        //If response text can be parsed to JSON, add Pretty print tab.
        try {
          var bodyPretty = new dijit.layout.ContentPane({title:"JSON Pretty print"});
          var bodyPrettyText = new dijit.form.SimpleTextarea({
            value:dojo.toJson(dojo.fromJson(ioArgs.xhr.responseText), true), //Pretty print
            style:"width:97%;height:97%;"
          });
          dojo.place(bodyPrettyText.domNode, bodyPretty.domNode);
          containerCenterCenter.addChild(bodyPretty);
        } catch (Error) {
          //console.debug("text is not JSON");
        }

        if (ioArgs.xhr.status !== 0) {
          var table = dojo.create("table");
          var headers = ioArgs.xhr.getAllResponseHeaders().split("\n");
          headers.forEach(function (header, i) {
            var split = header.split(": ");
            if (split[0]) {
              var tr = dojo.create("tr");
              var th = dojo.create("th", {innerHTML:escapeHTML(split[0])});
              var td = dojo.create("td", {innerHTML:escapeHTML(split[1])});
              dojo.place(th, tr);
              dojo.place(td, tr);
              dojo.place(tr, table);
            }
          });
          var headerContent = new dijit.TitlePane({
            title:"HTTP Response Headers",
            open:formData.openHeader[0],
            content:table
          });
          dojo.place(headerContent.domNode, containerBottomCenter.domNode);
        }

        var request = new dijit.TitlePane({
          title:"Your Request Data",
          open:formData.openRequest[0],
          content:dojo.toJson(ioArgs.args, true, "<br>&nbsp;&nbsp;&nbsp;&nbsp;")
        });
        dojo.place(request.domNode, containerBottomCenter.domNode);

        return {center:containerCenter, bottom:containerBottom};
      };

      var generateRequestObject = function () {
        var requestObject = {};
        requestObject.headers = {};
        requestObject.postData = "";

        dojo.mixin(requestObject, formCommon.get("value"));
        dojo.mixin(requestObject.headers, formHeaders.get("value"));
        if (formOtherHeaders.get("value")) {
          try {
            dojo.mixin(requestObject.headers, dojo.fromJson(formOtherHeaders.get("value")));
          } catch (e) {
            console.error(e);
          }
        }
        requestObject.postData = formBody.get("value");

        return requestObject;
      };

      var saveRequest = function (number) {
        var requestObject = generateRequestObject();
        if (formOtherHeaders.get("value")) {
          requestObject.OtherHeaders = formOtherHeaders.get("value");
        } else {
          requestObject.OtherHeaders = "";
        }
        localStorage[number] = dojo.toJson(requestObject);
      };

      var loadRequest = function (number) {
        var requestObject = dojo.fromJson(localStorage[number]);
        if (requestObject) {
          formCommon.set("value", requestObject);
          formBody.set("value", requestObject.postData);
          formOtherHeaders.set("value", requestObject.OtherHeaders);
          formHeaders.set("value", requestObject.headers);
        }
      };

      var refreshSeries = function() {
        var seriesList = dojo.fromJson(localStorage['seriesList']);
        console.log(seriesList);
        if (seriesList) {
          //TODO dojo.store
          dojo.query('data-poster-series-select')
        }
      };

      var changeSeries = function(seriesNumber) {
        console.log(seriesNumber);
      };

      var createSeries = function(title) {
        var seriesList = dojo.fromJson(localStorage['seriesList']);
        if (!seriesList) {
          seriesList = [];
        }
        seriesList.push(title);
        localStorage['seriesList'] = dojo.toJson(seriesList);
      };

      var deleteSeries = function(seriesNumber) {
        var seriesList = dojo.fromJson(localStorage['seriesList']);
        delete seriesList[seriesNumber];
        localStorage['seriesList'] = dojo.toJson(seriesList);
      };

      var escapeHTML = function (value) {
        return value.toString().replace(/\&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;")
      };

      //event initialization

      dojo.query('[data-poster-request]').forEach(function (node, i) {
        dojo.connect(node, node.getAttribute("data-poster-event-type"), function () {
          send(node.getAttribute("data-poster-request"));
        });
      });

      dojo.query('[data-poster-save]').forEach(function (node, i) {
        dojo.connect(node, node.getAttribute("data-poster-event-type"), function () {
          saveRequest(node.getAttribute("data-poster-save"));
        });
      });

      dojo.query('[data-poster-load]').forEach(function (node, i) {
        dojo.connect(node, node.getAttribute("data-poster-event-type"), function () {
          loadRequest(node.getAttribute("data-poster-load"));
        });
      });

      dojo.query('[data-poster-series-select]').forEach(function (node, i) {
        dojo.connect(node, node.getAttribute("data-poster-event-type"), function () {

        });
      });

      dojo.query('[data-poster-series-showDialog]').forEach(function (node, i) {
        dojo.connect(node, node.getAttribute("data-poster-event-type"), function () {
          seriesCreateDialog.show();
        });
      });

      dojo.query('[data-poster-series-showDialog]').forEach(function (node, i) {
        dojo.connect(node, node.getAttribute("data-poster-event-type"), function () {
          seriesCreateDialog.show();
        });
      });

      dojo.query('[data-poster-series-create]').forEach(function (node, i) {
        dojo.connect(node, node.getAttribute("data-poster-event-type"), function () {
          createSeries(dijit.byId("seriesName").get('value'));
        });
      });

      refreshSeries();

    });
  });
})();