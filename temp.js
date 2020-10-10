const HOST_NAME = location.host;
const VERSION_NAME = 'CACHE-v1';
const CACHE_NAME = HOST_NAME + '-' + VERSION_NAME;
const CACHE_HOST = [HOST_NAME, 'cdn.bootcss.com'];

const isNeedCache = function(url) {
    return CACHE_HOST.some(function(host) {
        return url.search(host) !== -1;
    });
};

const isCORSRequest = function(url, host) {
    return url.search(host) === -1;
};
//判断请求是否成功
const isValidResponse = function(response) {
    return response && response.status >= 200 && response.status < 400;
};

const handleFetchRequest = function(req) {
    if (isNeedCache(req.url)) {
        const request = isCORSRequest(req.url, HOST_NAME) ? new Request(req.url, {mode: 'cors'}) : req;
        return caches.match(request)
            .then(function(response) {
                // Cache hit - return response directly
                if (response) {
                    // Update Cache for next time enter
                    fetch(request)
                        .then(function(response) {

                            // Check a valid response
                            if(isValidResponse(response)) {
                                caches
                                    .open(CACHE_NAME)
                                    .then(function (cache) {
                                        cache.put(request, response);
                                    });
                            } else {
                                sentMessage('Update cache ' + request.url + ' fail: ' + response.message);
                            }
                        })
                        .catch(function(err) {
                            sentMessage('Update cache ' + request.url + ' fail: ' + err.message);
                        });
                    return response;
                }

                // Return fetch response
                return fetch(request)
                    .then(function(response) {
                        // Check if we received an unvalid response
                        if(!isValidResponse(response)) {
                            return response;
                        }

                        const clonedResponse = response.clone();

                        caches
                            .open(CACHE_NAME)
                            .then(function(cache) {
                                cache.put(request, clonedResponse);
                            });

                        return response;
                    });
            });
    } else {
        return fetch(req);
    }
};