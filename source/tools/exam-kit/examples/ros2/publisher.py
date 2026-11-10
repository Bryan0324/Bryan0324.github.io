"""Finite ROS 2 feeder. Sends 21, 0, -5 once a subscriber is discovered.

REPLACE: type, topics, values/dataset, message fields, and period.
The subscriber count is a discovery aid, not proof of delivery to the judge.
"""
import rclpy
from rclpy.node import Node
from rclpy.qos import DurabilityPolicy, QoSProfile, ReliabilityPolicy
from std_msgs.msg import Int32


TOPICS = ("/number",)  # Separate topics for board A/B only when specified.
VALUES = (21, 0, -5)
PERIOD_SECONDS = 1.0


class Feeder(Node):
    def __init__(self):
        super().__init__("exam_feeder")
        qos = QoSProfile(
            depth=10,
            reliability=ReliabilityPolicy.RELIABLE,
            durability=DurabilityPolicy.VOLATILE,
        )
        self.outputs = [self.create_publisher(Int32, topic, qos) for topic in TOPICS]
        self.next_index = 0
        self.timer = self.create_timer(PERIOD_SECONDS, self.tick)

    def tick(self):
        if self.next_index == len(VALUES):
            self.timer.cancel()
            self.get_logger().info("all samples sent; Ctrl-C to exit")
            return
        pub = self.outputs[self.next_index % len(self.outputs)]
        if pub.get_subscription_count() == 0:
            return
        out = Int32()
        out.data = VALUES[self.next_index]
        # For a custom message, assign its ID from this global index here.
        pub.publish(out)
        self.get_logger().info(f"sent index={self.next_index} value={out.data}")
        self.next_index += 1


def main():
    rclpy.init()
    node = Feeder()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.try_shutdown()


if __name__ == "__main__":
    main()
