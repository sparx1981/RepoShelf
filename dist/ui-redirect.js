'use strict';
location.replace('/studio.html'+(/^#ui(?:\/[a-z0-9-]{1,80})?$/.test(location.hash)?location.hash:'#ui'));
