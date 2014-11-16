/*******************************************************************************
 * 
 * Author: Vishal P.R <vishal.pr@webyog.com>
 *
 * The file contains the various custom jquery ui widgets.
 *******************************************************************************/


(function ($) {   
    var lockEleMetrics = function(element, isForce) {
        var options = null;

        if(isForce === true || $.contains(document.body, element[0]) === false) {
            options = {};
            options.element = element;
            options.parent = element.parent();
            options.prevSibling = element.prev();

            options.css = {
                position: element.css('position'),
                display: element.css('display'),
                visibility: element.css('visibility'),
                'z-index': element.css('z-index'),
                top: element.css('top')
            };

            element.css({
                    position: 'absolute',
                    display: 'block',
                    visibility: 'hidden',
                    'z-index': -55,
                    top: 0
                });

            $('body').prepend(element);
        }

        return options;
    };    
    
    var unlockEleMetrics = function(options) {
        if(options) {
            options.element.detach();
            options.element.css(options.css);

            if(options.prevSibling.length)
                options.element.insertAfter(options.prevSibling);
            else if(options.parent.length)
                options.parent.append(options.element);
        }
    };
    
    var getNodePosition = function(node, reativeNode) {     
        var top = 0, left = 0, reativeNodePos = null, tempNode = node;

        if(reativeNode)
            reativeNodePos = getNodePosition(reativeNode);

        while(node) {  	
           if(node.tagName) {
               top = top + node.offsetTop;
               left = left + node.offsetLeft;   	
               node = node.offsetParent;
           } else
               node = node.parentNode;
        }

        if(reativeNodePos) {
            left = left - reativeNodePos.left;
            top = top - reativeNodePos.top;
        }

        return {
            left: left, 
            top: top, 
            right: left + $(tempNode).outerWidth(), 
            bottom: top + $(tempNode).outerHeight()
        };
    };
        
    $.fn.mousehold = function(callback, timeout) {    
        timeout = timeout || 100;
    
        if(callback && typeof callback === 'function') {
            var timer = 0;
            var flag = false;
            return this.each(function() {
                $(this).mousedown(function() {
                    var that = this;
                    flag === false && callback.call(this), flag = true;
                    timer = setInterval(function() {
                        callback.call(that);
                    }, timeout);
                });

                var releaseCapture = function() {
                    flag = false;
                    clearInterval(timer);
                };

                $(this).mouseleave(releaseCapture);
                $(this).mouseup(releaseCapture);
            });
        }
    };
    
    $.fn.selectRange = function(start) {
        return this.each(function() {
            if(document.body.createRange) {
                var range = document.body.createTextRange();

                if(range) {
                    range.moveToElementText(this);
                    range.moveStart('character', start);
                    range.select();
                }
            } else if(window.getSelection){
                var selection = window.getSelection();
                var textNode = this.firstChild;
                var range = document.createRange();
                range.setStart(textNode, start);
                range.setEnd(textNode, textNode.length);
                selection.removeAllRanges();
                selection.addRange(range);
            }
        });
    };
    
    $.fn.cssApplied = function() {
        var s = {};
        var css = window.getComputedStyle(this.get(0));
        
        for(var key in css) {
            if(isNaN(key) && css.hasOwnProperty(key))
                s[key] = css[key];
        }
        
        return s;
    };
    
    $.fn.delayFocus = function(delay) {
        var that = this;
        delay = typeof delay !== 'number' ? 100 : delay;
        
        setTimeout(function() {
                that.focus();
            }, delay);
            
        return this;
    };
    
    $.fn.getValidDate = function() {
        var value = this.val().toLowerCase().match(/^\s*((0?[0-9])|10|11|12)\s*\/\s*(([0-2]?[0-9])|(30)|(31))\s*\/\s*[0-9]?[0-9]?[0-9]?[0-9]\s*$/g);

        if(value && value.length === 1) {
            value = value[0];
            var maxDays = 30;
            var startPos = value.indexOf('/');
            var month = Number(value.substring(0, startPos));
            value = value.substring(startPos + 1);
            startPos = value.indexOf('/');
            var day = Number(value.substring(0, startPos));
            var year = Number(value.substring(startPos + 1));
            
            if([1, 3, 5, 7, 8, 10, 12].indexOf(month) !== -1)
                maxDays = 31;
            else if(month === 2)
                maxDays = (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) ? 29 : 28;
            
            if(day > maxDays)
                return null;
            
            return this.datepicker('getDate');
        }
        
        return null;
    };
    
    $.fn.submitButton = function(callback) {
        var that = this;
        
        this.on('click', function(event) {
            if(that.hasClass('disable-click'))
                return false;
            
            that.addClass('disable-click');
            var ret = callback(event);
                
            if(ret)
                ret.always(function() {
                    that.removeClass('disable-click');
                    
                });
            else {
                that.removeClass('disable-click');
                
            }
        });
    };
    
    $.extend($.expr[':'], {
        vscrollable: function(element) {
            var overflowY = $(element).css('overflowY');
            
            if(overflowY === 'scroll') 
                return true;
            
            var overflow = $(element).css('overflow');
            return element.clientHeight < element.scrollHeight && 
                (overflowY === 'auto' || overflow === 'scroll' || overflow === 'auto');            
        },
        
        hscrollable: function(element) {
            var overflowX = $(element).css('overflowX');
            
            if(overflowX === 'scroll') 
                return true;
            
            var overflow = $(element).css('overflow');
            return element.clientWidth < element.scrollWidth && 
                (overflowX === 'auto' || overflow === 'scroll' || overflow === 'auto'); 
        }
    });
    
    $.widget('custom.scrollableTabs', $.ui.tabs, {
        options: {
            barHeight: 28, 
            scrollButtonWidth: 22, 
            scrollTimeout: 100,
            paddingForInMemoryCalc: 0
        },
                
        _create: function() {
            this._superApply(arguments);
            var ulEle = this.element.find('.ui-tabs-nav').first(), that = this;
            var buttonWidth = this.options.scrollButtonWidth * 2;
            var tabBarHeight = this.options.barHeight;
            var ulEleCSSPos = ulEle.css('position');

            if(ulEleCSSPos !== 'fixed' && ulEleCSSPos !== 'relative' && ulEleCSSPos !== 'absolute')
                ulEle.css('position', 'relative');

            ulEle.wrapInner('<div class="outer-wrapper" style="height: ' + tabBarHeight + 'px; overflow: hidden; float: left; position: absolute; left: 22px; right: 22px;">' + 
                '<div class="inner-wrapper" style="height: ' + tabBarHeight + 'px; position: relative; left: 0px; float: left"></div>' + 
                '</div>');
            ulEle.css('height', tabBarHeight + 'px');        
            ulEle.prepend('<div style="width: ' + (buttonWidth / 2 - 2) + 'px; float: left; height: ' + (tabBarHeight - 2) + 'px; "></div>');
            ulEle.append('<div style="width: ' + (buttonWidth / 2 - 2) + 'px; float: right; height: ' + (tabBarHeight - 2) + 'px; "></div>');
            var leftScrollButton = ulEle.children().first();
            var rigthScrollButton = ulEle.children().last();
            leftScrollButton.button({text: true, icons: {secondary: 'ui-icon ui-icon-carat-1-w'}});
            leftScrollButton.children('.ui-icon-carat-1-w').first().css('left', '2px');         
            leftScrollButton.find('.ui-button-text').css('padding', '0px');
            leftScrollButton.css('margin', '0px');
            rigthScrollButton.button({text: true, icons: {secondary: 'ui-icon ui-icon-carat-1-e'}});
            rigthScrollButton.children('.ui-icon-carat-1-e').first().css('left', '2px');        
            rigthScrollButton.find('.ui-button-text').css('padding', '0px');
            rigthScrollButton.css('margin', '0px');
            var innerEle = ulEle.find('.inner-wrapper').first();

            leftScrollButton.mousehold(function() {
                var offset = 50;
                var currentPosition = innerEle.css('left').replace('px', '') / 1;

                if(innerEle.children('li').eq(0).css('float') !== 'left') {
                    innerEle.children().each(function(i,li){innerEle.prepend(li);});
                    innerEle.children('li').css('float', 'left');
                }

                if(currentPosition + offset >= 0) {
                    innerEle.stop().animate({left: '0'}, that.options.scrollTimeout);
                } else
                    innerEle.stop().animate({left: currentPosition + offset + 'px'}, that.options.scrollTimeout);
            }, this.options.scrollTimeout);

            rigthScrollButton.mousehold(function() {
                var tabBarWidth = that.element.find('.ui-tabs-nav').eq(0).width() - buttonWidth;
                var offset = 50, tabsRealWidth = 0;
                var currentPosition = innerEle.css('left').replace('px', '') / 1;
                tabsRealWidth = innerEle.css('width').replace('px', '') / 1;

                if(tabsRealWidth + (currentPosition - offset) > tabBarWidth) {
                    if(innerEle.children('li').eq(0).css('float') !== 'left') {
                        innerEle.children().each(function(i,li){innerEle.prepend(li);});
                        innerEle.children('li').css('float', 'left');
                    }

                    innerEle.stop().animate({left: currentPosition - offset + 'px' }, that.options.scrollTimeout);
                }
                else {
                    if(innerEle.children('li').eq(0).css('float') !== 'right') {
                        innerEle.children().each(function(i,li){innerEle.prepend(li);});
                        innerEle.children('li').css('float', 'right');
                    }

                    innerEle.stop().animate({left: -(tabsRealWidth - tabBarWidth) + 'px' }, that.options.scrollTimeout);
                } 
            }, this.options.scrollTimeout);
            
            this.element.find('.ui-tabs-nav').disableSelection();
            var that = this;
            
            this._onResize = function() {
                that.refreshTabs(false);
            };
            
            this._bindTabEvents();
            this.refreshTabs();
            return this;
        },
        
        /**Method for refreshing scrollable tabs
        * 
        * @param {bool} isRefreshLayout : Whether to refresh entire tab layout or just to resize the header
        */
        refreshTabs: function(isRefreshLayout) {
            var lockOptions = lockEleMetrics(this.element);
            var tabBarWidth = this.element.find('.ui-tabs-nav').eq(0).width();
            var buttonWidth = this.element.find('.ui-tabs-nav').children('div').first().outerWidth() * 2;
            this.element.find('.ui-tabs-nav').append(this.element.find('.ui-tabs-nav').find('li'));
            isRefreshLayout !== false && this.refresh();
            var isChangeFloat = false, width = 0, that = this;

            this.element.find('.ui-tabs-nav').find('li').each(function() {                
                width += lockOptions ? $(this).outerWidth(true) + that.options.paddingForInMemoryCalc : $(this).outerWidth(true);
            });        

            if(this.element.find('.ui-tabs-nav').eq(0).outerWidth() >= width) {
                this.element.find('.ui-tabs-nav').children('div').first().hide();
                this.element.find('.ui-tabs-nav').children('div').last().hide();
                this.element.find('.ui-tabs-nav').find('.inner-wrapper').css('left', '0px');
                this.element.find('.ui-tabs-nav').find('.outer-wrapper').css({left: '0px', right: '0px'});
                isChangeFloat = true;
            } else {
                this.element.find('.ui-tabs-nav').children('div').show();
                this.element.find('.ui-tabs-nav').find('.outer-wrapper').css({left: '22px', right: '22px'});
            }
            
            width += 10;
            var innerEle = this.element.find('.ui-tabs-nav').find('.inner-wrapper');
            innerEle.html(this.element.find('.ui-tabs-nav').find('li'));
            innerEle.css('width', '' + width + 'px');
            var currentPosition = innerEle.css('left').replace('px', '') / 1;

            if(currentPosition + width < tabBarWidth - buttonWidth && 
                this.element.find('.ui-tabs-nav').children('div').first().is(':visible')) {
                if(innerEle.children('li').eq(0).css('float') !== 'right') {
                    innerEle.children().each(function(i,li){innerEle.prepend(li);});
                    innerEle.children('li').css('float', 'right');
                }

                innerEle.css({left: -(width - (tabBarWidth - buttonWidth) + 4) + 'px' });
            } else if(isChangeFloat === true &&
                innerEle.children('li').eq(0).css('float') === 'right') {
                innerEle.children().each(function(i,li){innerEle.prepend(li);});
                innerEle.children('li').css('float', 'left');
            }
            
            unlockEleMetrics(lockOptions);
        },
                
        insertTab: function(label, content, index) {
            var innerEle = this.element.find('.ui-tabs-nav').find('.inner-wrapper');
            var isReversed = innerEle.children('li').eq(0).css('float') === 'right' ? true : false;

            if(typeof index === 'number') {
                var liCount = innerEle.children('li').length;
                isReversed === false ? innerEle.children('li').eq(index).before(label) :
                    innerEle.children('li').eq(liCount - index).after(label);    
            } else
                isReversed === false ? innerEle.append(label) : innerEle.prepend(label);

            label.css('float', isReversed === true ? 'right' : 'left');
            this.element.append(content);
            this.refreshTabs();
            innerEle.children('li').length === 1 && this.option('active', 0);
        },
                
        deleteTab: function(liEle, callback) {
            var that = this;
            liEle = typeof liEle === 'number' ? 
                this.element.find('.inner-wrapper').children('li').eq(liEle) : liEle;

            var removeHelper = function(){
                var panelId = liEle.remove().attr("aria-controls");
                $( "#" + panelId ).remove();
                that.refreshTabs();
                typeof callback === 'function' && callback();
            };

            if(liEle.next('li').length === 0 && 
                this.element.find('.ui-tabs-nav').children('div').first().is(':visible') === false)
                removeHelper();
            else
                liEle.animate({width: '0' }, 'fast', removeHelper);
        },
        
        _bindTabEvents: function() {            
            this._unbindTabEvents();
            $(window).bind('resize', this._onResize);
        },
        
        _unbindTabEvents: function() {
            $(window).unbind('resize', this._onResize);
        },
                  
        _destroy: function() {
            this._unbindTabEvents();
        },
                
        _toggle: function(event, eventData) {
            var lockOptions = lockEleMetrics(this.element);;
            var count = 0, padding = 0, that = this;
            var innerEle = eventData.newTab.closest('.inner-wrapper');
            
            innerEle.find('li').each(function() {           
                padding += lockOptions ? that.options.paddingForInMemoryCalc : 0;
                count++;

                if(eventData.newTab[0] === this)
                    return false;
            }); 
            
            var tabPos = getNodePosition(eventData.newTab[0]);
            var containerPos = getNodePosition(eventData.newTab.closest('.outer-wrapper')[0]);
            unlockEleMetrics(lockOptions);
            tabPos.left += padding;
            tabPos.right += padding;
            
            if(tabPos.left < containerPos.left)
                innerEle.stop().animate({left: '+=' + (containerPos.left - tabPos.left)}, this.options.scrollTimeout);
            else if(tabPos.right > containerPos.right) {
                var liEle = innerEle.find('li');
                
                if(liEle.length === count && liEle.eq(0).css('float') !== 'right') {
                    liEle.each(function(i, li) {
                            innerEle.prepend(li);
                        });
                        
                    liEle.css('float', 'right');
                }
                                
                innerEle.stop().animate({left: '-=' + (tabPos.right - containerPos.right + 1)}, this.options.scrollTimeout);
            }
            
            this._superApply(arguments);
        }
    });
    
    $.widget('custom.timespinner', $.ui.spinner, {
        options: {
            step: 60 * 1000,
            page: 60,
            isFormat12Hr: true,
            isDefaultToGMT: false
        },
                
        _getTime: function(value, date) {
            var regex = this.options.isFormat12Hr ? /^\s*((0?[0-9])|10|11|12)\s*:\s*[0-5]?[0-9]\s+(am|pm)\s*$/g : /^\s*((0?[0-9])|(1?[0-9])|(2?[0-3]))\s*:\s*[0-5]?[0-9]\s*$/g;
            value = value.toLowerCase().match(regex);
                
            if(value && value.length === 1) {
                date = date ? date : this._getCurrentDate();
                value = value[0];
                var endIndex = value.indexOf(':');
                var hr = Number(value.substr(0, endIndex).trim());
                value = value.substr(endIndex + 1).trim();
                var min = Number(value);
                
                if(this.options.isFormat12Hr) {
                    endIndex = value.indexOf(' ');
                    min = Number(value.substr(0, endIndex).trim());
                    var tt = value.substr(endIndex + 1).trim();
                    date.setHours(tt === 'am' ? hr % 12 : 12 + (hr % 12));
                } else
                    date.setHours(hr);
                
                date.setMinutes(min);
                date.setSeconds(0);
                date.setMilliseconds(0);
                return date.getTime();
            }
        },
                
        _getCurrentDate: function() {
            var date = new Date();
            
            if(this.options.isDefaultToGMT === false)
                return date;
                        
            var offset = date.getTimezoneOffset() * 60 * 1000;   
            date.setTime(date.getTime() + offset);
            return date;
        },

        _parse: function(value) {
            if(typeof value === 'string') {
                if(Number(value) === value)
                    return Number(value);
                
                value = this._getTime(value);

                if(isNaN(value)) {
                    value = this._getCurrentDate().getTime();
                }
            }

            return value;
        },

        _format: function(value) {
            if(this.options.isFormat12Hr)
                return (new Date(value)).format('h:MM TT');
            
            return (new Date(value)).format('H:MM');
        },
                
        getTime: function(date) {
            date = date ? date : this._getCurrentDate();
            var time = this._getTime(this.element.val(), date);
            return typeof time === 'undefined' ? null : date;
        }
    });

    $.widget('custom.checkbox', {
        options: {
            state: 0
        },

        _create: function() {
            var that = this;
            
            switch(this.options.state) {
                case -1:
                case 0:
                case 1:
                    break;
                    
                default:
                    this.options.state = 0;
            }
            
            this.element.addClass('checkbox');
            
            if(this.element.hasClass('checked'))
                this.options.state = 1;
            else if(this.element.hasClass('indeterminate'))
                this.options.state = -1;
                
            this._setState(this.options.state);
            this._on(this.element, {
                    click: that._onClick
                });
                
            this.element.next().is('label') && this._on(this.element.next(), {
                    click: that._onClick
                });
        },
                
        _onClick: function(event) {
            if(this.element.hasClass('state-disabled'))
                return;
   
            var value = '';

            switch(this.options.state) {
                case 1:
                case -1:
                    value = 0;
                    break;

                case 0:
                    value = 1;
                    break;
            }

            this._setState(value);
            this.element.trigger('change', event);
        },

        _setState: function(value) {
            switch(value) {
                case 1:
                    this.element.removeClass('unchecked indeterminate');
                    this.element.addClass('checked');
                    this.options.state = 1;
                    break;

                case 0:
                    this.element.removeClass('checked indeterminate');
                    this.options.state = 0;
                    break;

                case -1:
                    this.element.removeClass('checked unchecked');
                    this.element.addClass('indeterminate');
                    this.options.state = -1;
                    break;
            };
        },
                
        state: function(state, isTrigger, origEvent) {
            if(typeof state === 'string') {
                switch(state) {
                    case 'checked':
                        state = 1;
                        break;
                        
                    case 'unchecked':
                        state = 0;
                        break;
                        
                    case 'indeterminate':
                        state = -1;
                        break;
                };
            } else if(typeof state === 'boolean')
                state = state ? 1 : 0;
    
            if(typeof state === 'number') {
                this._setState(state);
                isTrigger === true && this.element.trigger('change', origEvent);
            }
                
            return this.options.state;
        },

        _setOptions: function(options) {
            typeof options.state !== 'undefined' && this.state(options.state);
        },

        _setOption: function(key, value) {
            key === 'state' && this.state(value);
        },
        
        _destroy: function() {
    
        },
                
        destroy: function() {
    
        }
    });  
    
    $.widget('custom.popupMenu', { 
        options: {
            beforeShow: null,
            close: null,
            rightAlign: false,
            posElement: $()
        },
        
        _create: function() {
            this.parentElement = this.element.parent();
            this.prevSiblingElement = this.element.prev();
            this.searchElement = this.element.find('input');
            this.dropListElement = this.element.find('ul');
            this.scrollParent = null;
            this.element.addClass('popup-menu');
            this.dropListElement.find('li.placeholder').hide();
            var that = this;
            
            this._onClickWindow = function(event) {
                if(that.element[0] !== event.target &&
                    $.contains(that.element[0], event.target) === false)
                    that.close();
            };
            
            this._onResize = function() {
                that.close(false);
            };
            
            $(window).off('mousedown', this._onClickWindow);
            $(window).on('mousedown', this._onClickWindow);
            $(window).unbind('resize', this._onResize);
            $(window).bind('resize', this._onResize);
            this._bindEvents();
        },
        
        _getScrollParent: function() {
            if(!this.scrollParent) {
                var that = this;
                
                this._onScrollScrollParent = function() {
                    that.close(false);
                };
                
                var element = $(this.options.posElement);
                element = element.length ? element : this.element;
                this.scrollParent = $(element).closest(':vscrollable');
                this.scrollParent.unbind('scroll', this._onScrollScrollParent);
                this.scrollParent.bind('scroll', this._onScrollScrollParent);
            }
            
            return this.scrollParent;
        },
        
        _bindEvents: function() {
            this._on(this.searchElement, {
                    'keydown': this._onKeydownSearchElement,
                    'keyup': this._onKeyupSearchElement,
                    'click': this._onClickSearchElement
                });
                
            this._on(this.dropListElement, {
                    'mouseenter li:not(.placeholder):not(.no-highlight)': this._onMouseEnterListElement,
                    'click li:not(.placeholder):not(.no-highlight)': this._onClickDropListElement
                });
        },
        
        _onClickSearchElement: function() {
            return false;
        },
        
        _onKeyupSearchElement: function(event) {     
           if(event.keyCode === 13) {
                var selEle = this.dropListElement.children('.highlighted-item');
                
                if(selEle.length) {
                    this._onClickDropListElement({target: selEle[0]});
                    return false;
                }
            } else
                this._filter();
        },
        
        _onKeydownSearchElement: function(event) {
            if(event.keyCode === 38 || event.keyCode === 40) {
                var ele = this.dropListElement.children('.highlighted-item').eq(0);
                ele = event.keyCode === 38 ? ele.prevAll('li:not(.placeholder):not(.no-highlight):visible').eq(0) : ele.nextAll('li:not(.placeholder):not(.no-highlight):visible').eq(0);
                this._setHighlightedDropListItem(ele, event);
                return false;
            } else if(event.keyCode === 27)
                this.close();
        },
        
        _onClickDropListElement: function(event) {
            this.close(event.target);
        },
        
        _filter: function() {
            var ele = this.dropListElement.children();
            var liEle = this.dropListElement.find('.highlighted-item');
            var filter = this.searchElement.val().toLowerCase();
            var showCount = 0;
            
            if(filter !== '') {
                ele.not(function() {
                        var value = $(this).text().toLowerCase();
                        return value.indexOf(filter) === -1 ? false : true;
                    }).hide();

                ele = ele.filter(function() {
                        var value = $(this).text().toLowerCase();
                        return value.indexOf(filter) === -1 ? false : true;
                    });
            }
            
            showCount = ele.show().length;
            this.open();
            
            if(!liEle.is(':visible')) {
                liEle = ele.eq(0);                
            }
            
            this._setHighlightedDropListItem(liEle);
            return showCount;
        },
        
        open: function() {
            var lockOptions = lockEleMetrics(this.element, !this.element.is(':visible'));
            if(this.dropListElement[0].scrollHeight > this.dropListElement[0].clientHeight)
                this.dropListElement.css('overflow-y', 'scroll');
            else
                this.dropListElement.css('overflow-y', 'auto');
            unlockEleMetrics(lockOptions);
            
            if(!lockOptions) {
                if(!this.dropListElement.find('li:not(.placeholder):not(.no-highlight):visible').length)
                    this.dropListElement.find('li.placeholder').show();
                else
                    this.dropListElement.find('li.placeholder').hide();
                    
                return;
            }
            
            !this.dropListElement.children('.highlighted-item').length && 
                this._setHighlightedDropListItem(this.dropListElement.children('li:not(.placeholder):not(.no-highlight)').eq(0));
            var elePos = getNodePosition(this.options.posElement);
            var scrollPos = this._getScrollParent().scrollTop();
            elePos.top -= scrollPos;
            elePos.bottom -= scrollPos;
            var css = {position: 'fixed', top: elePos.bottom};
            
            if(this.options.rightAlign === true) {
                var bodyPos = getNodePosition($('body')[0]);
                css.left = 'auto';
                css.right = bodyPos.right - elePos.right;
            } else {
                css.right = 'auto';
                css.left = elePos.left;
            }
            
            this.element.css(css);
            typeof this.options.beforeShow === 'function' && this.options.beforeShow(this.element, css.top, css.left);
            this.element.appendTo('body').show();
            this.searchElement.focus();
            if(!this.dropListElement.find('li:not(.placeholder):not(.no-highlight):visible').length)
                this.dropListElement.find('li.placeholder').show();
            else
                this.dropListElement.find('li.placeholder').hide();
        },
        
        close: function(element) {
            this.element.hide();
            
            if(this.prevSiblingElement.length)
                this.element.insertAfter(this.prevSiblingElement);
            else if(this.parentElement.length)
                this.parentElement.append(this.element);
            
            typeof this.options.close === 'function' && this.options.close(element ? $(element).closest('li') : element);
        },
        
        _onMouseEnterListElement: function(event) {
            $(event.target).siblings().removeClass('highlighted-item');
            $(event.target).addClass('highlighted-item');
        }, 
        
        _setHighlightedDropListItem: function(ele, event) {
            if(typeof ele === 'undefined')
                return;

            var liEle = ele;

            if(!liEle || !liEle.length)
               return false;

            liEle.addClass('highlighted-item').siblings().removeClass('highlighted-item');

            if(!event || event.type === 'keydown' ||  event.type === 'keyup') {
                var liElePos = getNodePosition(liEle[0]);
                var dropElePos = getNodePosition(this.dropListElement[0]);
                var scrollPos = this.dropListElement.scrollTop();

                if(liElePos.top - scrollPos < dropElePos.top)
                    this.dropListElement.scrollTop(liElePos.top - dropElePos.top);
                else if(liElePos.bottom - scrollPos > dropElePos.bottom)
                    this.dropListElement.scrollTop(liElePos.bottom - dropElePos.bottom);
            }

            return true;
        },
        
        _destroy: function() {
            $(window).off('mousedown', this._onClickWindow);
            $(window).unbind('resize', this._onResize);
            this.scrollParent && this.scrollParent.unbind('scroll', this._onScrollScrollParent);
        }
    });
    
    $.widget('custom.chosen', {
        options: {
            dropListElement: $(),
            currentList: [],
            paddingForInMemoryCalc: 5,
            placeHolderText: '',
            beforeShow: null,
            tooltipDelimiter: '<br>',
            linkClass: '',
            isPerformLookup: true,
            chosenTextClass: 'tooltip-on-ellipsis-only'
        },

        _create: function() {    
            this.isUpdateDropList = true;
            this.dropListElement = this.options.dropListElement;
            this.moreElement = this.element.find('.chosen-more-link').eq(0);
            this.placeHolderElement = this.element.find('.chosen-placeholder').eq(0);
            this.scrollParent = null;
            
            if(!this.moreElement.length)
                this.moreElement = $('<div class="chosen-more-link" style="position: absolute; bottom: 0px;"><a></a></div>');
            
            if(!this.placeHolderElement.length)
                this.placeHolderElement = $('<span class="chosen-placeholder"></span>');
            
            this.moreElement.hide().find('a').addClass(this.options.linkClass);            
            this.placeHolderElement.text(this.options.placeHolderText).css({position: 'absolute', left: 0, bottom: 0});
            var checkEle = this.element.find('.chosen-list').eq(0), isExistingEle = false;
            
            if(!checkEle.length) {
                this.ulElement = $('<ul class="chosen-list" style="position: relative; left: 0px; display: inline-block;"></ul>');
                
                for(var i = 0; i < this.options.currentList.length; ++i) {
                    var text = null, name = null;
                    
                    if(this.options.isPerformLookup === true) {
                        var liEle = this.dropListElement.find('li[name="' + this.options.currentList[i] + '"]').eq(0);
                        
                        if(liEle.length) {
                            text = liEle.text();
                            name = liEle.attr('name');
                        }
                    } else
                        text = name = this.options.currentList[i];
                    
                    text && this.ulElement.append(this._createChosenItem(text, name));
                }
            } else {
                this.ulElement = checkEle;
                isExistingEle = true;
            }
            
            var checkEle = this.ulElement.find('.chosen-search').eq(0);
            
            if(!checkEle.length) {
                this.searchElement = $('<li class="chosen-search" style="float: left; position: relative;"><input type="text" style="border: none; padding: 0px;" /></li>');
                this.ulElement.append(this.searchElement);
                var wrapperEle = $('<div class="chosen-list-wrapper" style="position: absolute; z-index: 1; left: 0px; right: 0px; top: 0px; bottom: 0px; overflow: hidden;"></div>');
                wrapperEle.html(this.ulElement);
                this.element.html(wrapperEle);
            } else
                this.searchElement = checkEle;
            
            this.searchElement.find('input').css({
                    width: 14 + 'px',
                    padding: '0px',
                    margin: '0px',
                    'background-color': 'transparent'
                });
            var lockOptions = lockEleMetrics(this.searchElement);
            this.element.css({
                    position: 'relative',
                    height: this.searchElement.outerHeight() + 'px'
                });
            unlockEleMetrics(lockOptions);
            this.element.addClass('chosen');
            this.element.append(this.placeHolderElement);
            this._bindEvents();
            this._on(this.moreElement, {
                    'click a': this._onClickMoreLink
                });
            var that = this;
            
            this._onClickWindow = function(event) {
                if(that.dropListElement[0] !== event.target &&
                    $.contains(that.dropListElement[0], event.target) === false &&
                    $.contains(that.searchElement[0], event.target) === false)
                    that.showDropdownList(false);
            };
            
            this._onResize = function() {
                if(that.searchElement.find('input').attr('disabled') === 'disabled')
                    that.enable(false);
                else {
                    that.showDropdownList(false);
                    that._setHighlightedItem(that.ulElement.find('.highlighted-item').eq(0), false);
                }
            };
            
            $(window).unbind('resize', this._onResize);
            $(window).bind('resize', this._onResize);
            
            if(isExistingEle === true)
                this.refreshChosenList();
            else
                this._setChosenListWidth();
            
            this._updatePlaceHolderElement();
        },
                
        _destroy: function() {
            $(window).unbind('resize', this._onResize);
            this.scrollParent && this.scrollParent.unbind('scroll', this._onScrollScrollParent);
            this.element.html('');
        },
                
        _bindEvents: function() {
            this._unbindEvents();
            this._on(this.ulElement, {
                    'keydown': this._onKeydownUlElement,
                    'click li .chosen-item-close': this._onClickCloseElement,
                    'click li': this._onClickLiElement,
                    'focus': this._onFocusUlElement
                });
            this._on(this.searchElement, {
                    'keydown input': this._onKeydownSearchElement,
                    'keyup input': this._onKeyupSearchElement,
                    'click input': this._onClickSearchElement,
                    'focus input': this._onFocusInput
                });
        },
                
        _unbindEvents: function() {
            this._off(this.ulElement, 'keydown');
            this._off(this.ulElement, 'click li .chosen-item-close');
            this._off(this.ulElement, 'click li');
            this._off(this.ulElement, 'focus');
            this._off(this.searchElement, 'keydown input');
            this._off(this.searchElement, 'keyup input');
            this._off(this.searchElement, 'click input');
            this._off(this.searchElement, 'focus input');
        },
                
        refreshChosenList: function() {
            var that = this;
            
            this.options.isPerformLookup && this.ulElement.find('.chosen-item').each(function() {
                    var name = $(this).attr('name');
                    
                    if(typeof name !== 'string') {
                        $(this).remove();
                        return;
                    }
                        
                    var ele = that.dropListElement.find('li[name="' + name + '"]');
                    
                    if(ele.length)
                        $(this).find('.chosen-text').text(ele.text());
                    else
                        $(this).remove();
                });
                
            this._setChosenListWidth();
        },
                
        _onClickMoreLink: function() {
            return false;
        },
                
        _createChosenItem: function(text, name) {
            var liEle = $('<li style="float: left; position: relative;" class="chosen-item"><span class="chosen-item-close"></span><span class="chosen-text">' + text + '</span></li>');
            typeof name === 'string' && liEle.attr('name', name);
            liEle.find('.chosen-text').addClass(this.options.chosenTextClass).attr('title', text);
            return liEle;
        },
                        
        _onClickSearchElement: function() {
            this.showDropdownList();
            return false;
        },
                
        _onFocusUlElement: function() {
            this.searchElement.find('input').attr('tabindex', '-1');
            this.ulElement.attr('tabindex', '0');
        },
                
        _onFocusInput: function(event) {
            this.ulElement.removeAttr('tabindex');
            this.searchElement.find('input').removeAttr('tabindex');
            var liEle = $(event.target).closest('li');
            this._setHighlightedItem(liEle, false);             
        },
                
        _onClickLiElement: function(event) {
            if(!$(event.target).is('input')) {
                var liEle = $(event.target).closest('li');
                this._setHighlightedItem(liEle);
            }
        },
                
        _scrollToElement: function(ele) {
            if(!ele.length)
                return;
            
            var parent = ele.parent();
            var posEle = getNodePosition(ele[0]);
            var posParent = getNodePosition(parent.parent()[0]);
            
            if(posEle.left < posParent.left)
                parent.css('left', '+=' + (posParent.left - posEle.left));
            else if(posEle.right > posParent.right)
                parent.css('left', '-=' + (posEle.right - posParent.right));
        },
                
        _onClickDropListElement: function(event) {   
            var liEle = this._createChosenItem($(event.target).text(), $(event.target).attr('name'));
            this.searchElement.find('input').val('');
            this.searchElement.before(liEle);       
            this._updatePlaceHolderElement();
            var customEvent = $.Event('chosenItemInserted');
            customEvent.target = liEle[0];
            this.element.trigger(customEvent);
            $(event.target).addClass('chosen-item').removeClass('highlighted-item').hide();
            var liEle = $(event.target).nextAll(':not(.chosen-item)').eq(0);
            
            if(!liEle.length)
                liEle = $(event.target).prevAll(':not(.chosen-item)').eq(0);
            
            liEle.addClass('highlighted-item');
            this._setChosenListWidth();
            this._scrollToElement(this.searchElement);
            this.searchElement.find('input').focus();
            this.showDropdownList();
        },
                
        _setChosenListWidth: function() {
            var width = 0, that = this, searchEleWidth = 0;
            var lockOptions = lockEleMetrics(this.element);
            var chosenItems = this.ulElement.children('.chosen-item');
            
            chosenItems.each(function() {
                    width += lockOptions ? $(this).outerWidth(true) + that.options.paddingForInMemoryCalc : $(this).outerWidth(true);
                });
                
            searchEleWidth = Math.min(this.element.width(), this._getSearchEleWidth());
            
            if(width + searchEleWidth < this.element.width())
                searchEleWidth = this.element.width() - width;
            
            this.searchElement.find('input').css('width', searchEleWidth + 'px');
            width += searchEleWidth;
            
            if(chosenItems.length === 1 && this.searchElement.find('input').attr('disabled') === 'disabled')
                this.ulElement.css('width', '100%');
            else
                this.ulElement.css('width', width + 'px');
            
            if(this.element.width() > width)
                this.ulElement.css('left', '0');
            else {
                var posEle = getNodePosition(this.ulElement[0]);
                var posParent = getNodePosition(this.element[0]);
                
                if(posEle.right < posParent.right)
                    this.ulElement.css('left', '-=' + (posEle.right - posParent.right));
            }
            
            unlockEleMetrics(lockOptions);
        },
                
        _onKeydownUlElement: function(event) {
            var ele = this.ulElement.find('li.highlighted-item');
            var isInput = $(event.target).is('input');
            
            if(event.keyCode === 37 || event.keyCode === 39) {          
                if(isInput && event.target.selectionEnd !== 0)
                    return;
                
                this.showDropdownList(false);
                ele = event.keyCode === 37 ? ele.prev() : ele.next();
                this._setHighlightedItem(ele);
            } else if(event.keyCode === 9)
                this.showDropdownList(false);
            else if(event.keyCode === 8) {                
                if(isInput && event.target.selectionEnd !== 0)
                    return;
                
                this._removeChosenElement(ele.prev());
                this._updateDropList();
                this._setHighlightedItem(ele);
            } else if(event.keyCode === 46) {     
                if(!ele.find('input').length) {
                    var nextEle = ele.next();
                    this._removeChosenElement(ele);
                    this._setHighlightedItem(nextEle);
                    this.isUpdateDropList = true;
                }
            } else if(event.keyCode === 27) {
                if(this.showDropdownList(false))
                    return false;
            } else if(event.keyCode === 36) {     
                if(isInput && event.target.selectionEnd !== 0)
                    return;
                
                ele = this.ulElement.children().eq(0);
                this._setHighlightedItem(ele);
            } else if(event.keyCode === 35) {
                if(isInput)
                    return;
                
                this._setHighlightedItem(this.searchElement);
            }
        },
        
        _removeChosenElement: function(ele) {
            if(ele.length) {
                var customEvent = $.Event('chosenItemDeleted');
                customEvent.target = ele[0];
                this.element.trigger(customEvent);
                ele.remove();
                this._updatePlaceHolderElement();
            }
        },
                
        _onClickCloseElement: function(event) {
            var ele = $(event.target).closest('li');
            
            if(ele.hasClass('highlighted-item'))
                this._setHighlightedItem(ele.next());
            else
                this._setChosenListWidth();
            
            this._removeChosenElement(ele);
            this._setChosenListWidth();
            this.isUpdateDropList = true;
        },
                
        _setHighlightedItem: function(ele, isSetFocus) {
            if(!ele.length)
                return;
            
            ele = ele.closest('li');
            ele.addClass('highlighted-item').siblings().removeClass('highlighted-item');
            
            if(isSetFocus !== false) {
                if(ele.find('input').length)
                    ele.find('input').focus();
                else
                    this.ulElement.focus();
            }            
            
            this._setChosenListWidth();
            this._scrollToElement(ele);
        },
        
        _setHighlightedDropListItem: function(ele, event) {
            if(typeof ele === 'undefined')
                return;

            var liEle = ele;

            if(!liEle || !liEle.length)
               return false;

            liEle.addClass('highlighted-item').siblings().removeClass('highlighted-item');

            if(!event || event.type === 'keydown' ||  event.type === 'keyup') {
                if(this.dropListElement.is(':visible')) {
                    var liElePos = getNodePosition(liEle[0]);
                    var dropElePos = getNodePosition(this.dropListElement[0]);
                    var scrollPos = this.dropListElement.scrollTop();

                    if(liElePos.top - scrollPos < dropElePos.top)
                        this.dropListElement.scrollTop(liElePos.top - dropElePos.top);
                    else if(liElePos.bottom - scrollPos > dropElePos.bottom)
                        this.dropListElement.scrollTop(liElePos.bottom - dropElePos.bottom);
                }
            }

            return true;
        },
                
        _onKeyupSearchElement: function(event) {    
            if(event.keyCode === 13) {
                var selEle = [];
                
                if(this.dropListElement.is(':visible'))
                    selEle = this.dropListElement.children('li.highlighted-item');
                else if($.trim(this.searchElement.find('input').val()).length)
                    selEle = this._getFilteredEle();
                
                if(selEle.length) {
                    this._onClickDropListElement({target: selEle[0]});
                    return false;
                }
            } else {
                var isWordCharacter = String.fromCharCode(event.keyCode).match(/\w/);
                var isDropListVisible = this.dropListElement.is(':visible');
                
                if(isWordCharacter)
                    this.showDropdownList(true, false);
                else if((event.keyCode === 8 || event.keyCode === 46) &&
                    (event.target.selectionEnd !== 0 || isDropListVisible))
                    this.showDropdownList(true, false);
            }
        },
                
        _onKeydownSearchElement: function(event) {
            var ele = this.dropListElement.children('.highlighted-item').eq(0);
            var that = this;
            
            if(String.fromCharCode(event.keyCode).match(/\w/) ||
                event.keyCode === 8 || event.keyCode === 46 || event.keyCode === 32)
                setTimeout(function() {
                        that._setChosenListWidth();
                        that._scrollToElement(that.searchElement);
                        that._updatePlaceHolderElement(event);
                    }, 0);
            
            if(event.keyCode === 38 || event.keyCode === 40) {
                var isVisible = this.dropListElement.is(':visible');
                
                if(!this.showDropdownList())
                    return false;  
                
                if(!ele.length || isVisible === false)
                    ele = ele.length ? ele : this.dropListElement.children(':visible').eq(0);
                else
                    ele = event.keyCode === 38 ? ele.prevAll(':visible').eq(0) : ele.nextAll(':visible').eq(0);
                
                this._setHighlightedDropListItem(ele);
                return false;
            }
        },
        
        _updatePlaceHolderElement: function(event) {
            if(this.ulElement.find('.chosen-item').length || (event && $(event.target).val() !== ''))
                this.placeHolderElement.text('').hide();
            else
                this.placeHolderElement.text(this.options.placeHolderText).show();
        },
                
        _getFilteredEle: function() {
            var ele = this.dropListElement.children();
            var filter = this.searchElement.find('input').val().toLowerCase();
                
            ele = ele.not('.chosen-item');
            
            if(filter !== '') {
                ele = ele.filter(function() {
                        var value = $(this).text().toLowerCase();
                        return value.indexOf(filter) === -1 ? false : true;
                    });
            }
            
            return ele;
        },
                
        _filter: function() {
            var ele = this.dropListElement.children();
            var liEle = this.dropListElement.find('.highlighted-item');
            var filter = this.searchElement.find('input').val().toLowerCase();
            var showCount = 0;
                
            ele.filter('.chosen-item').hide();
            ele = ele.not('.chosen-item');
            
            if(filter !== '') {
                ele.not(function() {
                        var value = $(this).text().toLowerCase();
                        return value.indexOf(filter) === -1 ? false : true;
                    }).hide();

                ele = ele.filter(function() {
                        var value = $(this).text().toLowerCase();
                        return value.indexOf(filter) === -1 ? false : true;
                    });
            }
            
            showCount = ele.show().length;
            
            if(!liEle.is(':visible')) {
                liEle = ele.eq(0);                
                liEle.addClass('highlighted-item').siblings().removeClass('highlighted-item');
            }
            
            return showCount;
        },
                
        _updateDropList: function() {
            if(!this.element.find('.chosen-dropdown').length)
                return;
            
            var chosenItems = [];
            var liEle = this.dropListElement.find('.highlighted-item');
            this.dropListElement.find('li').removeClass('chosen-item highlighted-item');

            this.ulElement.find('.chosen-text').each(function() {
                    chosenItems.push($(this).text());
                });

            this.dropListElement.find('li').each(function() {
                    if(chosenItems.indexOf($(this).text()) !== -1)
                        $(this).addClass('chosen-item').hide();
                });
            
            if(liEle.hasClass('chosen-item')) {           
                liEle = liEle.nextAll(':not(.chosen-item)').eq(0);
                
                if(!liEle.length)
                    liEle = liEle.prevAll(':not(.chosen-item)').eq(0);
            }
            
            this._setHighlightedDropListItem(liEle);
        },
                
        showDropdownList: function(isShow) {
            if(isShow === false) {
                if(this.element.find('.chosen-dropdown').length) {
                    var listShown = this.dropListElement.is(':visible') ? 1 : 0;
                    this.dropListElement.hide();
                    this._unbindAdditionalEvents();
                    return listShown;
                }
                
                return 0;
            } else if(!this.element.find('.chosen-dropdown').length) {
                this.dropListElement.hide().addClass('chosen-dropdown').find('li').addClass('chosen-dropdown-item');
                this.element.append(this.dropListElement);
                this.isUpdateDropList = true;
            }
            
            if(this.isUpdateDropList) {
                this._updateDropList();
                this.isUpdateDropList = false;
            }
            
            var showCount = this._filter();
            
            if(!showCount) {
                this.dropListElement.hide();
                this._unbindAdditionalEvents();
                return 0;
            }
            
            var pos = getNodePosition(this.searchElement[0]);
            var elePos = getNodePosition(this.element[0]);
            var bodyPos = getNodePosition($('body')[0]);
            var css = {'left': pos.left + 'px', 'position': 'fixed'};
            var lockOptions = lockEleMetrics(this.dropListElement, !this.dropListElement.is(':visible'));
            
            if(this.dropListElement[0].scrollHeight > this.dropListElement[0].clientHeight)
                this.dropListElement.css('overflow-y', 'scroll');
            else
                this.dropListElement.css('overflow-y', 'auto');
            
            var height = this.dropListElement.outerHeight() + 15;
            var width = this.dropListElement.outerWidth();
            unlockEleMetrics(lockOptions);
            var scrollPos = this._getScrollParent().scrollTop();
            pos.top -= scrollPos;
            pos.bottom -= scrollPos;
            
            if(pos.left + width > elePos.right && pos.right - width > elePos.left) {
                _.extend(css, {'right': bodyPos.right - pos.right + 'px', 'left': 'auto'});
            } else {
                _.extend(css, {'left': pos.left + 'px', 'right': 'auto'});
            }
            
            if(this.dropListElement.is(':visible')) {
                this.dropListElement.css(css);
                return showCount;
            }
                        
            if(bodyPos.bottom - pos.bottom < height && bodyPos.bottom - pos.bottom < pos.top - bodyPos.top) {
                _.extend(css, {'bottom': bodyPos.bottom - pos.top + 'px', 'top': 'auto'});
            } else {
                _.extend(css, {'top': pos.bottom + 'px', 'bottom': 'auto'});
            }
            
            this.dropListElement.css(css);
            this._bindAdditionalEvents();
            typeof this.options.beforeShow === 'function' && this.options.beforeShow(this.dropListElement, css.top, css.left);
            this.dropListElement.show();
            return showCount;
        },
        
        _getScrollParent: function() {
            if(!this.scrollParent) {
                var that = this;
                
                this._onScrollScrollParent = function() {
                    that.showDropdownList(false);
                };
                
                this.scrollParent = $(this.element).closest(':vscrollable');
                this.scrollParent.unbind('scroll', this._onScrollScrollParent);
                this.scrollParent.bind('scroll', this._onScrollScrollParent);
            }
            
            return this.scrollParent;
        },
                
        _onMouseEnterListElement: function(event) {
            $(event.target).siblings().removeClass('highlighted-item');
            $(event.target).addClass('highlighted-item');
        },   
                
        _bindAdditionalEvents: function() {
            this._unbindAdditionalEvents();
            this._on(this.dropListElement, {
                    'mouseenter li': this._onMouseEnterListElement,
                    'click li': this._onClickDropListElement
                });
            
            $(window).on('mousedown', this._onClickWindow);
        },
                
        _unbindAdditionalEvents: function() {
            this._off(this.dropListElement, 'mouseenter click remove');
            $(window).off('mousedown', this._onClickWindow);
        },
                
        _renderMoreLink: function(isShow) {
            var that = this;
            
            if(isShow === false) {
                this.element.find('.chosen-list-wrapper').css('right', '0px');
                this.moreElement.hide();
                return false;
            }
            
            this.moreElement.find('a').text('+WWW');
            var lockOptions = lockEleMetrics(this.moreElement);
            var renderLinkWidth = this.moreElement.outerWidth();
            unlockEleMetrics(lockOptions);
            lockOptions = lockEleMetrics(this.element);
            var visibleCount = 0, totalCount = 0, visibleCountWithLink = 0;
            var eleWidth = this.element.width(), width = 0, tempWidth = 0, visibleWidthWithLink = -1;
            var tooltipStr = '';
            
            this.ulElement.find('.chosen-item').each(function() {
                    tempWidth = lockOptions ? $(this).outerWidth(true) + that.options.paddingForInMemoryCalc : $(this).outerWidth(true);
                    
                    if(width + tempWidth < eleWidth - renderLinkWidth)
                        visibleCountWithLink++;
                    else {
                        tooltipStr += (tooltipStr === '' ? '' : that.options.tooltipDelimiter) + $(this).find('.chosen-text').text();
                        visibleWidthWithLink = visibleWidthWithLink === -1 ? width : visibleWidthWithLink;
                    }
                    
                    if(width + tempWidth < eleWidth)
                        visibleCount++;
                    
                    width += tempWidth;
                    totalCount++;
                });
            
            unlockEleMetrics(lockOptions);
            
            if(totalCount > 1 && totalCount - visibleCount > 0) {
                this.moreElement.find('a').text('+' + (totalCount - visibleCountWithLink));
                this.moreElement.find('a').attr('title', tooltipStr);
                this.element.find('.chosen-list-wrapper').css('right', (eleWidth - visibleWidthWithLink) + 'px');
                this.moreElement.show().css('left', visibleWidthWithLink + 'px');
                this.element.append(this.moreElement);
            } else {
                this.element.find('.chosen-list-wrapper').css('right', '0px');
                this.moreElement.hide();
            }
        },
                
        enable: function(isEnable) {
            if(isEnable === false) {
                this.ulElement.find('ul.highlighted-item').removeClass('highlighted-item');
                this.ulElement.find('.chosen-item-close').hide();
                this.searchElement.find('input').val('').attr('disabled', 'disabled').hide();
                this._updatePlaceHolderElement();
                this._setChosenListWidth();
                this._scrollToElement(this.ulElement.find('.chosen-item').eq(0));
                this.ulElement.removeAttr('tabindex');
                this._unbindEvents();    
                this._renderMoreLink();
                this.element.addClass('chosen-disabled');
            } else {
                this._renderMoreLink(false);
                this._bindEvents();
                this.ulElement.find('.chosen-item-close').show();
                this.searchElement.find('input').val('').removeAttr('disabled').show();
                this._setChosenListWidth();
                this._setHighlightedItem(this.searchElement, false);
                this.element.removeClass('chosen-disabled');
                this._updatePlaceHolderElement();
            }
        },
                
        _getSearchEleWidth: function() {
            var searchEle = this.searchElement.find('input');
            var str = searchEle.val(), width = 0;
            
            if(str !== '') {
                var element = $('<span></span>');
                element.text(str);
                var css = {
                    'z-index': '-55',
                    width: 'auto',
                    padding: '0px',
                    margin: '0px'
                };
                element.css(css);
                $('body').append(element);
                width = element.outerWidth();
                element.remove();
                element = null;
            }
            
            return Math.max(width, 14);
        },
        
        getChosenList: function(isGetAsAssociative) {
            var chosenList = isGetAsAssociative === true ? {} : [];
            
            this.ulElement.find('li.chosen-item').each(function() {
                    if(isGetAsAssociative === true)
                        chosenList[$(this).attr('name')] = $(this).text();
                    else
                        chosenList.push($(this).attr('name'));
                });
                
            return chosenList;
        },
                
        deleteChosenItems: function() {
            this.ulElement.find('.chosen-item').remove();
            this._updatePlaceHolderElement();
            this._setChosenListWidth();
            this._scrollToElement(this.searchElement);
            this.searchElement.find('input').removeAttr('tabindex');
            return this.element;
        },
                
        deleteChosenItem: function(name) {
            var ele = this.ulElement.find('li[name="' + name + '"]');
            this._removeChosenElement(ele);
            this._setChosenListWidth();
        },
        
        addChosenItem: function(text, name) {
            this._onClickDropListElement({target: $('<li name="' + name + '">' + text + '</li>')[0]});
            this.showDropdownList(false);
        }
    });
    
    $.widget('custom.combo', {
        options: {
            beforeShow: null,
            placeHolderText: '',
            selectedItemClass: 'tooltip-on-ellipsis-only'
        },

        _create: function() {            
            this.headerElement = $('<div tabindex="0" class="combo-header" style="overflow: hidden; position: relative;"></div>');
            this.selectedElement = $('<div style="position: relative; overflow: hidden; text-overflow: ellipsis;" class="combo-selected-item"></div>');
            this.selectedElement.addClass(this.options.selectedItemClass);
            this.dropElement = $('<span class="combo-dropdown-button" style="float: right;"></span>');
            this.headerElement.append(this.dropElement);
            this.headerElement.append(this.selectedElement);
            this.dropListElement = this.element.find('ul').addClass('combo-dropdown');
            this.dropListElement.before(this.headerElement);
            this.dropListElement.hide();
            this.scrollParent = null;
            this.element.html(this.headerElement);
            this.element.append(this.dropListElement);
            
            if(!this._setHighlightedItem(this.element.attr('name')))
                this.selectedElement.text(this.options.placeHolderText);
            
            this._bindEvents();
            var that = this;
            
            this._onClickWindow = function(event) {
                if($.contains(that.element[0], event.target) === false)
                    that._showDropList(false);
            };
            
            this._onResize = function() {
                that._showDropList(false);
            };
            
            $(window).unbind('resize', this._onResize);
            $(window).bind('resize', this._onResize);
        },
        
        _getScrollParent: function() {
            if(!this.scrollParent) {
                var that = this;
                
                this._onScrollScrollParent = function() {
                    that._showDropList(false);
                };
                
                this.scrollParent = $(this.element).closest(':vscrollable');
                this.scrollParent.unbind('scroll', this._onScrollScrollParent);
                this.scrollParent.bind('scroll', this._onScrollScrollParent);
            }
            
            return this.scrollParent;
        },
        
        _destroy: function() {
            $(window).unbind('resize', this._onResize);
            this.scrollParent && this.scrollParent.unbind('scroll', this._onScrollScrollParent);
        },
                
        _bindEvents: function() {
            this._unbindEvents();
            this._on(this.element, {
                    'click': this._onClickElement,
                    'keydown': this._onKeydownElement,
                    'keyup': this._onKeyupElement
                });
                
            this._on(this.dropListElement, {
                    'mouseenter li': this._onMouseEnterListElement,
                    'click li': this._onClickDropListElement
                });
        },
                
        enable: function(isEnable) {
            if(isEnable === false) {
                this._unbindEvents();
                this.headerElement.removeAttr('tabindex');
            } else {
                this._bindEvents();
                this.headerElement.attr('tabindex', '0');
            }
        },
                
        _unbindEvents: function() {
            this._off(this.element, 'click');
            this._off(this.element, 'keydown');          
            this._off(this.element, 'keyup');          
            this._off(this.dropListElement, 'mouseenter li');
            this._off(this.dropListElement, 'click li');
        },
                
        _onMouseEnterListElement: function(event) {
            this._setHighlightedItem($(event.target), event);
        },
                
        _onClickDropListElement: function(event) {
            this._setHighlightedItem($(event.target), event);
            this._showDropList(false);
            this.headerElement.focus();
            return false;
        },
                
        _setHighlightedItem: function(ele, event) {
            if(typeof ele === 'undefined')
                return;
            
            var liEle = [];
            
            if(typeof ele === 'number')
                liEle = this.dropListElement.find('li:nth-child(' + ele + ')').eq(0);
            else if(typeof ele === 'string')
                liEle = this.dropListElement.find('li[name="' + ele + '"]').eq(0);
            else
                liEle = ele;
            
            if(!liEle || !liEle.length)
                return false;
            
            liEle.addClass('highlighted-item').siblings().removeClass('highlighted-item');
            
            if(!event || event.type === 'keydown' ||  event.type === 'keyup' || event.type === 'click') {
                if(this.dropListElement.is(':visible')) {
                    var liElePos = getNodePosition(liEle[0]);
                    var dropElePos = getNodePosition(this.dropListElement[0]);
                    var scrollPos = this.dropListElement.scrollTop();

                    if(liElePos.top - scrollPos < dropElePos.top)
                        this.dropListElement.scrollTop(liElePos.top - dropElePos.top);
                    else if(liElePos.bottom - scrollPos > dropElePos.bottom)
                        this.dropListElement.scrollTop(liElePos.bottom - dropElePos.bottom);
                }
                
                var text = liEle.text();
                this.selectedElement.text(text).attr('title', text);
                var isChanged = this.element.attr('name') !== liEle.attr('name');                
                this.element.attr('name', liEle.attr('name'));
                isChanged === true && this.element.trigger('change');
            }
            
            return true;
        },
                
        _onClickElement: function() {
            this._showDropList(!this.dropListElement.is(':visible'));
            return false;
        },
                
        _bindAdditionalEvents: function() {
            this._unbindAdditionalEvents();            
            $(window).on('mousedown', this._onClickWindow);
        },
                
        _unbindAdditionalEvents: function() {
            $(window).off('mousedown', this._onClickWindow);
        },
                
        _onKeydownElement: function(event) {            
            if(event.keyCode === 38 || event.keyCode === 40) {
                var ele = this.dropListElement.children('.highlighted-item').eq(0);
                
                if(!ele.length)
                    ele = this.dropListElement.children('li').eq(0);
                else 
                    ele = event.keyCode === 38 ? ele.prevAll('li').eq(0) : ele.nextAll('li').eq(0);
                
                this._setHighlightedItem(ele, event);
                return false;
            } else if(event.keyCode === 27) {
                if(this._showDropList(false) === true)
                    return false;
            } else if(event.keyCode === 9)
                this._showDropList(false);
        },
                
        _onKeyupElement: function(event) {
            if(event.keyCode === 13 && this.dropListElement.is(':visible')) {
                var ele = this.dropListElement.children('.highlighted-item').eq(0);
                this._setHighlightedItem(ele, event);
                this._showDropList(false);
                return false;
            }
        },
                
        _showDropList: function(isShow) {
            if(isShow === false) {
                var isListShown = this.dropListElement.is(':visible');
                this.dropListElement.hide();
                this._unbindAdditionalEvents();
                this._setHighlightedItem(this.element.attr('name'));
                return isListShown;
            } else {
                var pos = getNodePosition(this.dropElement[0]);
                var bodyPos = getNodePosition($('body')[0]);
                var css = {'position': 'fixed', 'right': bodyPos.right - pos.right + 'px'};
                var lockOptions = lockEleMetrics(this.dropListElement, !this.dropListElement.is(':visible'));
                var height = this.dropListElement.outerHeight() + 15;
                
                if(this.dropListElement[0].scrollHeight > this.dropListElement[0].clientHeight)
                    this.dropListElement.css('overflow-y', 'scroll');
                else
                    this.dropListElement.css('overflow-y', 'auto');

                unlockEleMetrics(lockOptions);
                
                if(this.dropListElement.is(':visible'))
                    return;
                
                var scrollPos = this._getScrollParent().scrollTop();
                pos.top -= scrollPos;
                pos.bottom -= scrollPos;

                if(bodyPos.bottom - pos.bottom < height && bodyPos.bottom - pos.bottom < pos.top - bodyPos.top) {
                    _.extend(css, {'bottom': bodyPos.bottom - pos.top + 'px', 'top': 'auto'});
                } else {
                    _.extend(css, {'top': pos.bottom + 'px', 'bottom': 'auto'});
                }

                this.dropListElement.css(css);
                typeof this.options.beforeShow === 'function' && this.options.beforeShow(this.dropListElement, css.top);
                this._bindAdditionalEvents();
                this.dropListElement.show();
                this._setHighlightedItem(this.element.attr('name'));
            }
        }
    });
    
    var origSetOptionPrototype = $.ui.dialog.prototype._setOption;
    
    $.ui.dialog.prototype._setOption = function(key) {
        if(key === 'buttons') {
            origSetOptionPrototype.apply(this, arguments);
            var dialogEle = this.element;
            var buttonEle = dialogEle.siblings('.ui-dialog-buttonpane').find('button');
            buttonEle.length && buttonEle.css('width', (100 / buttonEle.length) + '%');
        } else
            origSetOptionPrototype.apply(this, arguments);
    };
    
    $.extend($.ui.dialog.prototype.options, {
        modal: true,
        resizable: false,
        draggable: false,
        closeText: null,
        width : 'auto',
        
        show: {
            effect: 'fade',
            duration: 250
        },
                
        hide: {
            effect: 'fade',
            duration: 250
        },
                
        close: function() {
            if($(this).parent().hasClass('set-maxwidth-to-available-width'))
                $(this).css({maxWidth: 'none'});
            if($(this).parent().hasClass('set-maxheight-to-available-height'))
                $(this).css({'max-height': 'none'});
            if($(this).parent().hasClass('no-titlebar'))
                $(this).siblings('.ui-dialog-titlebar').hide();
            if($(this).parent().hasClass('ignore-line-height'))
                $(this).css("line-height",'0px');
            $(this).dialog('destroy');
        },
                
        focus: function() {
            if(!$(this).find(':tabbable').length)
                $(this).siblings('.ui-dialog-buttonpane').find('button:first-child').focus(); 
            
            if($(this).parent().hasClass('set-maxwidth-to-available-width'))
                $(this).css({'max-width': $(this).width() + 'px'});
            
            if($(this).parent().hasClass('set-minwidth-to-available-width'))
                $(this).css({'min-width': $(this).width() + 'px'});
            
            if($(this).parent().hasClass('set-maxheight-to-available-height'))
                $(this).css({'max-height': $(this).height() + 'px'});
            
            if($(this).parent().hasClass('no-titlebar'))
                $(this).siblings('.ui-dialog-titlebar').hide();
            
            if($(this).parent().hasClass('ignore-line-height'))
                $(this).css("line-height",'0px');
        },
        
        create: function() {
            var dialogEle = $(this);
    
            if(dialogEle.parent().hasClass('set-maxwidth-to-available-width'))
                dialogEle.css({'max-width': 'none'});
            
            if(dialogEle.parent().hasClass('set-minwidth-to-available-width'))
                dialogEle.css({'min-width': 'none'});
            
            if(dialogEle.parent().hasClass('set-maxheight-to-available-height'))
                dialogEle.css({'max-height': 'none'});
            
            if($(this).parent().hasClass('no-titlebar'))
                $(this).siblings('.ui-dialog-titlebar').hide();
            
            if($(this).parent().hasClass('ignore-line-height'))
                $(this).css("line-height",'0px');
            
            var onChangeInput = function() {
                dialogEle.find('.error-indicator').hide().text('');
            };

            var onKeyUp = function(event) {
                if(event.keyCode === 13) {
                    dialogEle.siblings('.ui-dialog-buttonpane').find('button:first-child:not(.ui-button-disabled)').click();
                    return false;
                }
            };
            
            dialogEle.off('keyup');
            dialogEle.on('keyup', onKeyUp);
            dialogEle.off('keyup change paste', 'input[type="text"], input[type="password"], .combo');
            dialogEle.on('keyup change paste', 'input[type="text"], input[type="password"], .combo', onChangeInput);
            dialogEle.parent().find('.ui-dialog-titlebar-close').attr('tabindex','-1');
            var buttonEle = dialogEle.siblings('.ui-dialog-buttonpane').find('button');
            buttonEle.length && buttonEle.css('width', (100 / buttonEle.length) + '%');
        }
    });
})(jQuery);