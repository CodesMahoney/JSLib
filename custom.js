"use strict";

// -----------------------------------------
// How to use: 
// - mark a table as .editable, and/or .filterable and/or .sortable 
// - tables must have <thead> and <tbody> sections.
// - use .nosort and/or .nofilter on individual thead > tr > th cells to mark individual columns as not sortable, or not filterable.
// - use ajax_fetch to do your ajax calls and you'll get a nice wrapper that automagically
//     - puts in a progress spinner in the section you are replacing, 
//     - allows for onsuccess callback stuff (e.g. displaying toastr messages)
//     - animations can be passed to it to animate the insertion of your content section.
// - call Init() to rebind all of your grids, date controls, etc, all in one easy call.
// -----------------------------------------

var baseurl = "/async/";
var progress = "<div id=\"progress\"><div><i class=\"fa fa-5x fa-spinner fa-spin\"></i></div></div>";

var AnimationClasses = {
    bounce:"bounce",
    flash: "flash",
    pulse: "pulse",
    rubberBand: "rubberBand",
    shake: "shake",
    swing: "swing",
    tada: "tada",
    wobble: "wobble",
    bounceIn: "bounceIn",
    bounceInDown: "bounceInDown",
    bounceInLeft: "bounceInLeft",
    bounceInRight: "bounceInRight",
    bounceInUp: "bounceInUp",
    bounceOut: "bounceOut",
    bounceOutDown: "bounceOutDown",
    bounceOutLeft: "bounceOutLeft",
    bounceOutRight: "bounceOutRight",
    bounceOutUp: "bounceOutUp",
    fadeIn: "fadeIn",
    fadeInDown: "fadeInDown",
    fadeInDownBig: "fadeInDownBig",
    fadeInLeft: "fadeInLeft",
    fadeInLeftBig: "fadeInLeftBig",
    fadeInRight: "fadeInRight",
    fadeInRightBig: "fadeInRightBig",
    fadeInUp: "fadeInUp",
    fadeInUpBig: "fadeInUpBig",
    fadeOut: "fadeOut",
    fadeOutDown: "fadeOutDown",
    fadeOutDownBig: "fadeOutDownBig",
    fadeOutLeft: "fadeOutLeft",
    fadeOutLeftBig: "fadeOutLeftBig",
    fadeOutRight: "fadeOutRight",
    fadeOutRightBig: "fadeOutRightBig",
    fadeOutUp: "fadeOutUp",
    fadeOutUpBig: "fadeOutUpBig",
    flipInX: "flipInX",
    flipInY: "flipInY",
    flipOutX: "flipOutX",
    flipOutY: "flipOutY",
    lightSpeedIn: "lightSpeedIn",
    lightSpeedOut: "lightSpeedOut",
    rotateIn: "rotateIn",
    rotateInDownLeft: "rotateInDownLeft",
    rotateInDownRight: "rotateInDownRight",
    rotateInUpLeft: "rotateInUpLeft",
    rotateInUpRight: "rotateInUpRight",
    rotateOut: "rotateOut",
    rotateOutDownLeft: "rotateOutDownLeft",
    rotateOutDownRight: "rotateOutDownRight",
    rotateOutUpLeft: "rotateOutUpLeft",
    rotateOutUpRight: "rotateOutUpRight",
    slideInDown: "slideInDown",
    slideInLeft: "slideInLeft",
    slideInRight: "slideInRight",
    slideOutLeft: "slideOutLeft",
    slideOutRight: "slideOutRight",
    slideOutUp: "slideOutUp",
    slideOutDown: "slideOutDown",
    hinge: "hinge",
    rollIn: "rollIn",
    rollOut: "rollOut"
}

function Animation(animationIn, animationOut) {
    this.IN = animationIn;
    this.OUT = animationOut;
}

jQuery.fn.selectText = function () {
    var doc = document;
    var element = this[0];
    console.log(this, element);
    if (doc.body.createTextRange) {
        var range = document.body.createTextRange();
        range.moveToElementText(element);
        range.select();
    } else if (window.getSelection) {
        var selection = window.getSelection();
        var range = document.createRange();
        range.selectNodeContents(element);
        selection.removeAllRanges();
        selection.addRange(range);
    }
};

$.expr[':'].contains = function (elem, junk, filter) {
   return $(elem).text().toUpperCase().indexOf(filter[3].toUpperCase()) >= 0;
};

if (!String.format) {
    String.format = function (format) {
        var args = Array.prototype.slice.call(arguments, 1);
        return format.replace(/{(\d+)}/g, function (match, number) {
            return typeof args[number] != 'undefined' ?
                args[number] :
                match;
        });
    };
}

function AddAntiForgeryToken(data) {
    data.__RequestVerificationToken = $('#__AjaxAntiForgeryForm input[name=__RequestVerificationToken]').val();
    return data;
};

var addEvent = (function () {
    if (document.addEventListener) {
        return function (el, type, fn) {
            if (el && el.nodeName || el === window) {
                el.addEventListener(type, fn, false);
            } else if (el && el.length) {
                for (var i = 0; i < el.length; i++) {
                    addEvent(el[i], type, fn);
                }
            }
        };
    } else {
        return function (el, type, fn) {
            if (el && el.nodeName || el === window) {
                el.attachEvent('on' + type, function () { return fn.call(el, window.event); });
            } else if (el && el.length) {
                for (var i = 0; i < el.length; i++) {
                    addEvent(el[i], type, fn);
                }
            }
        };
    }
})();

function handleErrors(xhr, ajaxOptions, thrownError) {
    switch (xhr.status) {
        case 0:
            // no connection
            toastr.error("Lost Connection - Check internet connection, if problem persists, contact IT");
            $("#progress").remove();
            break;
        case 401:
            // unauthorized
            window.location.href = "/";
            break;
        default:
            toastr.error(xhr.status + " - " + thrownError);
            $("#progress").remove();
            console.log(xhr, ajaxOptions, thrownError);
    }
}

function movegrid(cell, dir) {
    var clickindex = cell.index();

    console.log("movegrid clickindex: " + clickindex);

    switch (dir) {
        case "up":
            cell.parents("tr").prev("tr").children().get(clickindex).click();
            break;
        case "down":
            cell.parents("tr").next("tr").children().get(clickindex).click();
            break;
        case "left":
            if (clickindex === 0) {
                cell.parents("tr").prev("tr").children().last().click();
            } else {
                cell.closest("td").prev("td").click();
            }
            break;
        case "right":
            if (clickindex === cell.parents("tr").children().length - 1) {
                cell.parents("tr").next("tr").children().first().click();
            } else {
                cell.closest("td").next("td").click();
            }
            break;
    }

    cell.removeClass("editing");
}

function getCellValue(row, index) {
    return $(row).children("td").eq(index).html();
}

function comparer(index) {
    return function (a, b) {
        var valA = getCellValue(a, index);
        var valB = getCellValue(b, index);
        return $.isNumeric(valA) && $.isNumeric(valB) ? valA - valB : valA.localeCompare(valB);
    };
}

function defaults(table) {
    $.each(table.find("thead tr:nth-child(1) th[data-default]"), function (i, obj) {
        var input = $("thead tr:nth-child(2) th:nth-child(" + ($(obj).index() + 1) + ") input[type='text']");
        input.val($(obj).data("default"));
        input.keyup(); // fire change event.
    });
}

function cleanupAllEditControls() {
    // all pre-existing controls
    var controls = $(".editctl");

    // loop through controls
    $.each(controls, function (i, obj) {
        // set the parent (cell)'s html to the value of the control
        $(obj).parents(0).eq(0).html($(obj).val());
        // remove the control
        $(obj).remove();
    });
}

function bindEditableGrid() {
    var $editable = $('.editable');

    if ($editable.length > 0) {
        $editable.find("tbody tr td:not('.noedit')").singleBind("click", function (e) {
            // if there are no inputs in this cell
            if ($(this).children("input, select").length > 0 === false) {

                cleanupAllEditControls();

                // store the cell
                var td = $(this);

                // get the text of the cell and trim it up
                var val = $.trim(td.text());

                // create an input ctrl
                var ctrl = $("<input class='editctl' type='text' />");

                // copy the cell value into the control value
                ctrl.val(val);

                td.addClass("editing");

                ctrl.singleBind("keydown", function(e) {
                    if (e.which === 9 || e.which === 13) {
                        e.preventDefault();
                    }

                    switch (e.which) {
                    case 37: // left
                        movegrid(td, "left");
                        break;
                    case 38: // up
                        movegrid(td, "up");
                        break;
                    case 9: // tab
                    case 13: // enter
                    case 39: // right
                        movegrid(td, "right");
                        break;
                    case 40: // down
                        movegrid(td, "down");
                        break;
                    default:
                        return; // exit this handler for other keys
                    }
                });

                // add event, when the input box loses focus,
                // update the cell value with the new ctrl value
                ctrl.singleBind("change blur", function() {
                    td.html(ctrl.val());
                    ctrl.remove();
                    td.removeClass("editing");
                });

                // put the control into the cell
                td.html(ctrl);

                // set the control as the focused item
                ctrl.focus();
            } 
        });

        $(".editable tbody > tr").singleBind("change", function () {
            $(this).addClass("modifiedrow");
        });
    }
}

function bindFilterSortGrid() {
    $(".sortable thead tr:first-child th:not(.nosort)").click(function () {
        var table = $(this).parents("table").eq(0);
        var rows = table.find("tr:not(:has('th'))").toArray().sort(comparer($(this).index()));
        this.asc = !this.asc;

        table.find("th .sorticon").remove(); //Class("sorting_asc").removeClass("sorting_desc");
       
        if (!this.asc) {
            rows = rows.reverse();
            $(this).append($("<i class='fa fa-sort-desc sorticon'></i>")); //addClass("sorting_desc");
        } else {
            $(this).append($("<i class='fa fa-sort-asc sorticon'></i>"));
            //$(this).addClass("sorting_asc");
        }
        for (var i = 0; i < rows.length; i++) {
            table.append(rows[i]);
        }
    });

    // additional code to apply a filters to each table
    $(".filterable:not('.filtering')").each(function () {
        $(this).addClass('filtering'); // keeps us from multiple binding a grid
        var table = $(this);
        var firstrow = table.find("tr:first()").eq(0);
        var headers = 0;
        var nonfilters = [];

        // account for colspans, so we have the right amount of filter columns.
        firstrow.find("th").each(function () {
            var cs = $(this).attr("colspan");
            
            // my attempt to create non filterable rows by adding true/false to an array with the headers index....
            if ($(this).hasClass("nofilter"))
                nonfilters[headers] = true;
            else
                nonfilters[headers] = false;

            if (cs) {
                headers = headers + Number(cs); // add however many cols the col spans
            } else {
                headers++; // add one col
            }
        });


        var filterrow = $("<tr class='filterrow'>").insertAfter($(this).find("th:last()").parent());
        //var summableIndexes = [];

        //table.find('thead tr:first-child th.summable').each(function () {
        //    summableIndexes.push($(this).index());
        //});

        //var widths = getTableColumnWidths(table);
        //setTableColumnWidths(table, widths);
        var thtext = "<th>"; // if using widths - "<th style='width: " + widths[i] + "px;'>"

        for (var i = 0; i < headers; i++) {

            if (nonfilters[i]) {
                //filterrow.append($(thtext));
                filterrow.append($(thtext).append($("<input placeholder='Filter' disabled>").attr("type", "text")));
            } else {
                filterrow.append($(thtext).append($("<input placeholder='Filter'>").attr("type", "text").keyup(function () {
                    table.find("tr").show();

                    // does filtering.
                    filterrow.find("input[type=text]").each(function () {

                        var index = $(this).parent().index() + 1;
                        var filter = $(this).val() !== "";
                        $(this).toggleClass("filtered", filter);

                        if (filter) {
                            var el = "td:nth-child(" + (index) + ")";
                            console.debug(el + ":not(:contains('" + $(this).val() + "'))");
                            table.children().children().children(el + ":not(:contains('" + $(this).val() + "'))").parent().css("display", "none");
                        }
                    });

                    // does summation
                    //summation(table, summableIndexes);

                })));
            }
        }

        //this does the intial summation
        //summation(table, summableIndexes);

        //this does a single round of defaulting
        defaults(table);

        if (!$("#admin_buttonbar #clearfilters").length > 0) {
            $('#admin_buttonbar').append($("<a href='#' class='btn btn-xs btn-warning' id='clearfilters'>Clear Table Filters</a>").click(function () {
                $(".filterable").find("input[type=text]").val("").toggleClass("filtered", false);
                $('.filterable').find("tr").css('display', "");
            }));
        }
    });
}

function ajax_fetch(url, fetch, data, callback, animation, dtype) {
    /// Posts to the server, and replaces the fetch jquery elem that you pass in
    var obj = {};
    obj.url = url;
    obj.fetch = fetch;
    obj.data = data;
    obj.callback = callback;
    obj.animation = animation;
    obj.dtype = dtype ? dtype : "text/html"; // "application/json" 
    console.log(new Date());
    console.log(obj);
    var allAnimations = [];

    if (animation)
        allAnimations = Object.getOwnPropertyNames(AnimationClasses);
    
    $("#overlay").remove();

    //clear the section and append the progress overlay
    //obj.fetch.append(progress);

    // register the function that does the ajax
    var doFetch = function () {
        console.log('Fetch Called: ' + url);
        // post to the server
        $.ajax({
            type: "Post",
            url: url,                                       // the endpoint we're sending to "usually /controller/action, e.g. /Ajax/Action
            data: data,                                     // the actual data we're sending
            contentType: "application/json",                // the type of what we're sending to the server
            dataType: dtype,                                // what we're expecting to get back
            success: function (response) {
                // replace the fetch dom element with the partial data
                fetch.html(response);

                // mark specifically designated single fetch items as fetched.
                if (!fetch.hasClass('fetched')) {
                    fetch.addClass("fetched");
                }

                if (animation) {
                    $.each(allAnimations, function (i, obj) {
                        fetch.removeClass(obj);
                    });
                    fetch.addClass(animation.IN).addClass("animated");
                }

                Init();

                // if there's a callback, run it.
                if (typeof callback == "function")
                    callback(response);
            },
            error: function (xhr, ajaxOptions, thrownError) {
                handleErrors(xhr, ajaxOptions, thrownError);
            }
        });
    }

    // register the function that will run our fetch.
    var fetchRunner = function () {
        // if no animation doPost immediately
        if (!animation) {
            doFetch();
        }
        else {
            // if we have an animation clear the previous animation            
            $.each(allAnimations, function (i, obj) {                
                fetch.removeClass(obj);
            });

            // add the animation class
            fetch.addClass("animated").addClass(animation.OUT);
            
            // wait 1 second, then call doPost
            setTimeout(doFetch, 1000); // check again in a second
        }
    }

    // run the fetch.
    fetchRunner();
}

function TopScroller() {
    var offset = 0,
        //browser window scroll (in pixels) after which the "back to top" link opacity is reduced
        offset_opacity = 1200,
        //duration of the top scrolling animation (in ms)
        scroll_top_duration = 700,
        //grab the "back to top" link
        $back_to_top = $('.bubble_icon#gototop-bubble');

    //hide or show the "back to top" link
    $(window).scroll(function () {
        ($(this).scrollTop() > offset) ? $back_to_top.addClass('cd-is-visible') : $back_to_top.removeClass('cd-is-visible cd-fade-out');
        if ($(this).scrollTop() > offset_opacity) {
            $back_to_top.addClass('cd-fade-out');
        }
    });

    //smooth scroll to top
    $back_to_top.on('click', function (event) {
        event.preventDefault();
        $('body,html').animate({
            scrollTop: 0,
        }, scroll_top_duration);
    });
}

function bindDragDrop() {
    $(".draggable").draggable({
        appendTo: "#mainwrap",
        helper: "clone",
        revert: true,
        drag: function () {
            $(this).addClass("dragging");
        },
        stop: function () {
            $(this).addClass("dragged");
            $(this).removeClass("dragging");
        }
    });

    $(".droppable, .tddropzone").droppable({
        hoverClass: "ui-state-hover",
        drop: function (event, ui) {

            var ret = {
                "ShiftDate": $('#dayrow li.active a').data("date"),
                "ShiftId": $('#dayrow li.active a').data("shift"),
                "StaffId": ui.draggable.data("staff"),
                "ShiftFulfillmentId": $(this).data("shiftfulfillment"),
                "UnitId": $(this).parents("tbody").eq(0).data("unit")
            };

            var $block = ui.draggable;

            $block.html(progress);

            ajax_fetch("/ajax/CreateAssignment", $block, JSON.stringify(ret));
        }
    });

    $("td.tddropzone:not(div.droplist_container)").singleBind("click", function () {
        $(this).find("div.droplist_container").toggle();
        $(this).toggleClass("active");
    });
}

function Init() {
    bindEditableGrid();
    bindFilterSortGrid();
    //bindDragDrop();
   
    var editfields = $("#page-content-wrapper form input[type='text']");

    // auto focus first field.
    if (editfields != null && editfields.length > 0) {
        editfields[0].focus();
    }

    $('.date:not(.date.weekonly)').datepicker();

    //$(".fetchlink").singleBind("click", function (e) {
    //    e.preventDefault();

    //    var url = $(this).attr("href");
    //    ajax_fetch(url, $(".content"));
    //});

    $('#avail_section a').click(function (e) {
        e.preventDefault();
    });

    $(".table input").parent("td").css("padding", "0px");

    $(".trifold-dt td.inputcol input").on("click focus keyup", function (e) {
        var keycode = e.keyCode ? e.keyCode : e.which ? e.which : e.charCode;
        if (keycode === 9 || !keycode) {
          
            var $this = $(this);
            $this.select();

            $this.on("mouseup", function () {
                $this.off("mouseup");
                return false;
            });
        }
    });
}

$(function () {

    toastr.options = {
        "closeButton": true,
        "debug": false,
        "newestOnTop": true,
        "progressBar": true,
        "positionClass": "toast-bottom-right",
        "preventDuplicates": true,
        "onclick": null,
        "showDuration": "3000",
        "hideDuration": "3000",
        "timeOut": "5000",
        "extendedTimeOut": "1000",
        "showEasing": "swing",
        "hideEasing": "linear",
        "showMethod": "fadeIn",
        "hideMethod": "fadeOut",
    }

    Init();

    $("#feed_icon, #hide_feed").click(function () {
        $("#feed_container").toggleClass("showing");
        $("#feed_count").text("0");
    });    
 
    // Open close small chat
    $('.open-small-chat').singleBind("click", function () {
        $(this).children().toggleClass('fa-comments').toggleClass('fa-remove');
        $('.sidebard-panel').toggleClass('active');
    });

    $("#toggle-sidenav").click(function() {
        $('body').toggleClass("collapsed");
        localStorage.collapsed = $('body.collapsed').length;
    });

    TopScroller();
});

(function ($) {
    $.fn.sumColumns = function (options) {       
        var settings = $.extend({
            columnIndexes : Array.apply(null, { length: $("table > tbody > tr:first > td").length }).map(Number.call, Number)
        }, options);

        // does summation of summable data
        for (var i = 0; i < settings.columnIndexes.length; i++) {
            var sum = 0;
            var index = indsettings.columnIndexesexes[i] + 1;

            $.each(table.find("td:nth-child(" + (index) + "):visible"), function (i, obj) {
                //var val = $(this).text().replace(/,/g, "").trim();
                var val = $(this).data("val");
                if (val) {
                    sum += parseFloat(val);
                }
            });

            //table.siblings(".totalrow").eq(0).find("thead tr th:nth-child(" + (index) + ")").eq(0).text(sum.toFixed(2)).digits();
        }
    }
}(jQuery));