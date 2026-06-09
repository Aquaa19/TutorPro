package com.example.tutorpro

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.view.ViewGroup
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
import com.example.tutorpro.theme.TutorProTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            TutorProTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    WebViewScreen(
                        url = "https://tutor-manager-aquaaxs-projects.vercel.app?webview=true",
                        modifier = Modifier
                            .fillMaxSize()
                            .statusBarsPadding()
                            .navigationBarsPadding()
                    )
                }
            }
        }
    }
}

@Composable
fun WebViewScreen(url: String, modifier: Modifier = Modifier) {
    var webViewInstance by remember { mutableStateOf<WebView?>(null) }

    // Intercept hardware back button when WebView can go back
    BackHandler(enabled = webViewInstance?.canGoBack() == true) {
        webViewInstance?.goBack()
    }

    AndroidView(
        modifier = modifier,
        factory = { context ->
            WebView(context).apply {
                layoutParams = ViewGroup.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT
                )
                
                // WebViewClient interceptors
                webViewClient = object : WebViewClient() {
                    override fun shouldOverrideUrlLoading(
                        view: WebView?,
                        request: WebResourceRequest?
                    ): Boolean {
                        val requestUrl = request?.url?.toString() ?: return false
                        
                        // WhatsApp link intercepts
                        if (requestUrl.startsWith("whatsapp://") || requestUrl.contains("wa.me")) {
                            try {
                                val intent = Intent(Intent.ACTION_VIEW, Uri.parse(requestUrl))
                                context.startActivity(intent)
                                return true
                            } catch (e: Exception) {
                                try {
                                    val fallbackIntent = Intent(Intent.ACTION_VIEW, Uri.parse(requestUrl))
                                    context.startActivity(fallbackIntent)
                                } catch (ex: Exception) {
                                    // Fail silently
                                }
                                return true
                            }
                        }
                        
                        // Telephone, email intercepts
                        if (requestUrl.startsWith("tel:") || requestUrl.startsWith("mailto:")) {
                            try {
                                val intent = Intent(Intent.ACTION_VIEW, Uri.parse(requestUrl))
                                context.startActivity(intent)
                                return true
                            } catch (e: Exception) {
                                return true
                            }
                        }
                        
                        // Load in-app normally
                        return false
                    }
                }
                
                // Set WebChromeClient for page loading status/redirect support
                webChromeClient = android.webkit.WebChromeClient()
                
                 // WebView Engine settings
                 settings.apply {
                     javaScriptEnabled = true
                     domStorageEnabled = true
                     databaseEnabled = true
                     allowFileAccess = true
                     useWideViewPort = true
                     loadWithOverviewMode = true
                     builtInZoomControls = true
                     displayZoomControls = false
                     mixedContentMode = android.webkit.WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                     
                     // Bypass Google disallowed_useragent block by masking user-agent as Chrome Mobile
                     userAgentString = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
                 }
                 
                // Enable Cookies and Third-Party Cookies for cross-origin Firebase redirects
                val cookieManager = android.webkit.CookieManager.getInstance()
                cookieManager.setAcceptCookie(true)
                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.LOLLIPOP) {
                    cookieManager.setAcceptThirdPartyCookies(this, true)
                }
                
                // Add JavaScript Interface for native printing support
                addJavascriptInterface(object {
                    @android.webkit.JavascriptInterface
                    fun printInvoice(html: String, title: String) {
                        (context as? android.app.Activity)?.runOnUiThread {
                            val tempWebView = android.webkit.WebView(context)
                            tempWebView.webViewClient = object : android.webkit.WebViewClient() {
                                override fun onPageFinished(view: android.webkit.WebView?, url: String?) {
                                    val printManager = context.getSystemService(android.content.Context.PRINT_SERVICE) as android.print.PrintManager
                                    val printAdapter = tempWebView.createPrintDocumentAdapter(title)
                                    printManager.print(title, printAdapter, android.print.PrintAttributes.Builder().build())
                                }
                            }
                            tempWebView.loadDataWithBaseURL("https://tutor-manager-aquaaxs-projects.vercel.app/", html, "text/html", "UTF-8", null)
                        }
                    }
                }, "AndroidApp")
                 
                loadUrl(url)
                webViewInstance = this
            }
        },
        update = { webView ->
            webViewInstance = webView
        }
    )
}
