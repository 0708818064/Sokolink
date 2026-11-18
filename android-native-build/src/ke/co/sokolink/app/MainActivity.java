package ke.co.sokolink.app;

import android.app.Activity;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.View;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.Toast;

public class MainActivity extends Activity implements View.OnClickListener {

    private static final String PREFS_NAME = "SokoLinkPrefs";
    private static final String KEY_SERVER_URL = "server_url";
    // Production Vercel Frontend URL
    private static final String DEFAULT_URL = "https://sokolinked.vercel.app";

    private WebView webView;
    private ProgressBar progressBar;
    private LinearLayout errorLayout;
    private Button btnRetry;
    private long backPressedTime = 0;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        webView = (WebView) findViewById(R.id.webView);
        progressBar = (ProgressBar) findViewById(R.id.progressBar);
        errorLayout = (LinearLayout) findViewById(R.id.errorLayout);
        btnRetry = (Button) findViewById(R.id.btnRetry);

        configureWebView();

        if (btnRetry != null) {
            btnRetry.setOnClickListener(this);
        }

        // Clear any old legacy LAN/local IP from preferences so it always connects to production
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        prefs.edit().putString(KEY_SERVER_URL, DEFAULT_URL).apply();

        // Connect automatically to the production SokoLink Vercel deployment
        webView.loadUrl(DEFAULT_URL);
    }

    @Override
    public void onClick(View v) {
        if (v.getId() == R.id.btnRetry) {
            errorLayout.setVisibility(View.GONE);
            webView.setVisibility(View.VISIBLE);
            webView.loadUrl(DEFAULT_URL);
        }
    }

    private void configureWebView() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setGeolocationEnabled(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);
        settings.setUserAgentString(settings.getUserAgentString() + " SokoLinkAndroid/1.2");

        webView.setWebChromeClient(new SokoWebChromeClient(progressBar));
        webView.setWebViewClient(new SokoWebViewClient(this, errorLayout));
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
            return;
        }

        // On root page: double-tap back within 2 seconds to exit gracefully
        if (backPressedTime + 2000 > System.currentTimeMillis()) {
            super.onBackPressed();
        } else {
            Toast.makeText(this, "Press back again to exit SokoLink", Toast.LENGTH_SHORT).show();
            backPressedTime = System.currentTimeMillis();
        }
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK) {
            if (webView != null && webView.canGoBack()) {
                webView.goBack();
                return true;
            }
        }
        return super.onKeyDown(keyCode, event);
    }
}
