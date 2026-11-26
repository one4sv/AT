import SwiftUI
import UIKit
import WebKit

@main
struct AchieveTogetherApp: App {
    var body: some Scene {
        WindowGroup { AppWebView() }
    }
}

struct AppWebView: UIViewControllerRepresentable {
    func makeUIViewController(context: Context) -> UINavigationController {
        UINavigationController(rootViewController: AppViewController())
    }

    func updateUIViewController(_ controller: UINavigationController, context: Context) {}
}

private final class MenuMessageHandler: NSObject, WKScriptMessageHandler {
    weak var controller: AppViewController?

    init(_ controller: AppViewController) {
        self.controller = controller
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        controller?.receiveMenu(message)
    }
}

final class AppViewController: UIViewController, WKNavigationDelegate, UIEditMenuInteractionDelegate {
    private static let home = URL(string: "https://achievetogether.vercel.app/")!
    private var webView: WKWebView!
    private lazy var systemMenu = UIEditMenuInteraction(delegate: self)
    private var activeMenu: Menu?
    private var chosenAction: Int?
    private var menuPresented = false

    private struct Menu: Decodable {
        struct Action: Decodable {
            let title: String
            let disabled: Bool
            let destructive: Bool
        }
        let id: String
        let x: Double
        let y: Double
        let actions: [Action]
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        title = "AchieveTogether"
        navigationItem.leftBarButtonItem = UIBarButtonItem(
            image: UIImage(systemName: "chevron.backward"), style: .plain,
            target: self, action: #selector(back)
        )
        navigationItem.rightBarButtonItem = UIBarButtonItem(
            barButtonSystemItem: .refresh, target: self, action: #selector(reload)
        )

        let configuration = WKWebViewConfiguration()
        let content = configuration.userContentController
        content.add(MenuMessageHandler(self), name: "atNativeMenu")
        content.addUserScript(WKUserScript(source: Self.bridge, injectionTime: .atDocumentStart, forMainFrameOnly: true))
        webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = self
        webView.translatesAutoresizingMaskIntoConstraints = false
        webView.addInteraction(systemMenu)
        view.addSubview(webView)
        NSLayoutConstraint.activate([
            webView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            webView.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor),
            webView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: view.trailingAnchor)
        ])
        webView.load(URLRequest(url: Self.home))
    }

    @objc private func back() { webView.goBack() }
    @objc private func reload() { webView.reload() }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        navigationItem.leftBarButtonItem?.isEnabled = webView.canGoBack
    }

    fileprivate func receiveMenu(_ message: WKScriptMessage) {
        let origin = message.frameInfo.securityOrigin
        guard message.frameInfo.isMainFrame, origin.protocol == "https", origin.host == Self.home.host, origin.port == 443 || origin.port == 0,
              message.name == "atNativeMenu", activeMenu == nil,
              let body = message.body as? [String: Any],
              let data = try? JSONSerialization.data(withJSONObject: body),
              let menu = try? JSONDecoder().decode(Menu.self, from: data),
              !menu.actions.isEmpty else { return }

        activeMenu = menu
        chosenAction = nil
        menuPresented = false
        let point = CGPoint(x: min(max(0, CGFloat(menu.x)), webView.bounds.width),
                            y: min(max(0, CGFloat(menu.y)), webView.bounds.height))
        systemMenu.presentEditMenu(with: UIEditMenuConfiguration(identifier: menu.id as NSString, sourcePoint: point))
        DispatchQueue.main.asyncAfter(deadline: .now() + 1) { [weak self] in
            guard let self, self.activeMenu?.id == menu.id, !self.menuPresented else { return }
            self.finishMenu(action: -2)
        }
    }

    func editMenuInteraction(_ interaction: UIEditMenuInteraction, menuFor configuration: UIEditMenuConfiguration,
                             suggestedActions: [UIMenuElement]) -> UIMenu? {
        guard let menu = activeMenu else { return nil }
        return UIMenu(children: menu.actions.enumerated().map { index, action in
            var attributes: UIMenuElement.Attributes = []
            if action.disabled { attributes.insert(.disabled) }
            if action.destructive { attributes.insert(.destructive) }
            return UIAction(title: action.title, attributes: attributes) { [weak self] _ in
                self?.chosenAction = index
            }
        })
    }

    func editMenuInteraction(_ interaction: UIEditMenuInteraction, willPresentMenuFor configuration: UIEditMenuConfiguration,
                             animator: any UIEditMenuInteractionAnimating) {
        menuPresented = true
    }

    func editMenuInteraction(_ interaction: UIEditMenuInteraction, willDismissMenuFor configuration: UIEditMenuConfiguration,
                             animator: any UIEditMenuInteractionAnimating) {
        animator.addCompletion { [weak self] in
            self?.finishMenu(action: self?.chosenAction ?? -1)
        }
    }

    private func finishMenu(action: Int) {
        guard let menu = activeMenu else { return }
        activeMenu = nil
        chosenAction = nil
        menuPresented = false
        webView.callAsyncJavaScript(
            "window.atFinishNativeMenu?.(id, action)",
            arguments: ["id": menu.id, "action": action], in: nil, in: .page,
            completionHandler: nil
        )
    }

    private static let bridge = """
    (() => {
        if (location.origin !== 'https://achievetogether.vercel.app') return;
        const start = () => {
            const root = document.documentElement;
            root.dataset.atNative = 'true';
            let active;
            let fallbackMenu;
            window.atFinishNativeMenu = (id, action) => {
                if (!active || active.id !== id) return;
                const {menu, rows} = active;
                active = undefined;
                if (!menu.isConnected) return;
                menu.style.opacity = '';
                if (action === -2) fallbackMenu = menu;
                else if (action >= 0) rows[action]?.click();
                else menu.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true}));
            };
            new MutationObserver(() => {
                if (active || root.dataset.interfaceStyle !== 'iphone') return;
                const menu = document.querySelector('[data-at-native-menu="composition"][role="menu"]');
                if (!menu || menu === fallbackMenu || getComputedStyle(menu).visibility !== 'visible') return;
                const rows = [...menu.querySelectorAll('.ContextMenuButt')];
                if (!rows.length) return;
                const id = crypto.randomUUID();
                const rect = menu.getBoundingClientRect();
                active = {id, menu, rows};
                menu.style.opacity = '0';
                window.webkit.messageHandlers.atNativeMenu.postMessage({
                    id, x: rect.left + rect.width / 2, y: rect.top + rect.height / 2,
                    actions: rows.map(row => ({
                        title: row.textContent.trim(),
                        disabled: row.getAttribute('aria-disabled') === 'true',
                        destructive: row.classList.contains('delete')
                    }))
                });
            }).observe(root, {subtree: true, childList: true, attributes: true, attributeFilter: ['style', 'data-interface-style']});
        };
        if (document.documentElement) start();
        else {
            const waitForRoot = new MutationObserver(() => {
                if (!document.documentElement) return;
                waitForRoot.disconnect();
                start();
            });
            waitForRoot.observe(document, {childList: true});
        }
    })();
    """
}
