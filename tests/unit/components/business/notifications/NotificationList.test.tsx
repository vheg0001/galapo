import { render, screen, fireEvent } from "@testing-library/react";
import NotificationList from "@/components/business/notifications/NotificationList";
import { expect, test, describe, vi } from "vitest";
import { BusinessNotification } from "@/store/businessStore";

// Mock the child component
vi.mock("@/components/business/notifications/NotificationItem", () => ({
    default: ({ notification, onRead }: { notification: BusinessNotification; onRead: (id: string) => void }) => (
        <div data-testid="notification-item" onClick={() => onRead(notification.id)} className={notification.is_read ? "read" : "unread"}>
            {notification.title}
        </div>
    ),
}));

describe("NotificationList", () => {
    const mockNotifications: BusinessNotification[] = [
        {
            id: "1",
            type: "listing_approved",
            title: "Notification 1",
            message: "Msg 1",
            is_read: false,
            data: {},
            created_at: new Date().toISOString(),
        },
        {
            id: "2",
            type: "payment_confirmed",
            title: "Notification 2",
            message: "Msg 2",
            is_read: true,
            data: {},
            created_at: new Date().toISOString(),
        }
    ];

    const mockOnRead = vi.fn();

    test("renders notification items", () => {
        render(<NotificationList notifications={mockNotifications} onRead={mockOnRead} />);
        expect(screen.getByText("Notification 1")).toBeInTheDocument();
        expect(screen.getByText("Notification 2")).toBeInTheDocument();
    });

    test("unread items are highlighted in the list", () => {
        render(<NotificationList notifications={mockNotifications} onRead={mockOnRead} />);
        const items = screen.getAllByTestId("notification-item");
        expect(items[0]).toHaveClass("unread");
        expect(items[1]).toHaveClass("read");
    });

    test("filter tabs switch between All and Unread", () => {
        render(<NotificationList notifications={mockNotifications} onRead={mockOnRead} />);

        const unreadTab = screen.getByText(/unread/i);
        fireEvent.click(unreadTab);

        expect(screen.getByText("Notification 1")).toBeInTheDocument();
        expect(screen.queryByText("Notification 2")).not.toBeInTheDocument();

        const allTab = screen.getByText(/all/i);
        fireEvent.click(allTab);
        expect(screen.getByText("Notification 2")).toBeInTheDocument();
    });

    test("clicking an item calls onRead", () => {
        render(<NotificationList notifications={mockNotifications} onRead={mockOnRead} />);
        fireEvent.click(screen.getByText("Notification 1"));
        expect(mockOnRead).toHaveBeenCalledWith("1");
    });

    test("empty state shows correctly", () => {
        render(<NotificationList notifications={[]} onRead={mockOnRead} />);
        expect(screen.getByText(/No notifications yet/i)).toBeInTheDocument();
    });

    test("pagination works (Load More)", () => {
        // Create 25 notifications to trigger pagination (PAGE_SIZE = 20)
        const manyNotifications: BusinessNotification[] = Array.from({ length: 25 }, (_, i) => ({
            id: String(i),
            type: "test",
            title: `Notify ${i}`,
            message: "test",
            is_read: false,
            data: {},
            created_at: new Date().toISOString(),
        }));

        render(<NotificationList notifications={manyNotifications} onRead={mockOnRead} />);

        expect(screen.getAllByTestId("notification-item")).toHaveLength(20);

        const loadMore = screen.getByText(/Load more/i);
        fireEvent.click(loadMore);

        expect(screen.getAllByTestId("notification-item")).toHaveLength(25);
    });
});
