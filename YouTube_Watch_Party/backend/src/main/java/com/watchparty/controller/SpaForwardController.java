package com.watchparty.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaForwardController {

    /**
     * Forwards non-API and non-static asset routes to index.html
     * so that client-side React SPA routing works seamlessly on page reload.
     */
    @GetMapping(value = {
            "/{path:^(?!api|ws|assets|favicon\\.svg|icons\\.svg)[^\\.]*}",
            "/{path:^(?!api|ws|assets|favicon\\.svg|icons\\.svg)[^\\.]*}/**"
    })
    public String forwardSpaRoutes() {
        return "forward:/index.html";
    }
}
